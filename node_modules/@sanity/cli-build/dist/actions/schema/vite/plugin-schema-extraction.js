import path, { isAbsolute } from 'node:path';
import { logSymbols } from '@sanity/cli-core/ux';
import debounce from 'lodash-es/debounce.js';
import mean from 'lodash-es/mean.js';
import once from 'lodash-es/once.js';
import { SchemaExtractedTrace, SchemaExtractionWatchModeTrace } from '../../../telemetry/extractSchema.telemetry.js';
import { formatSchemaValidation } from '../formatSchemaValidation.js';
import { createSchemaPatternMatcher } from '../matchSchemaPattern.js';
import { runSchemaExtraction } from '../runSchemaExtraction.js';
import { SchemaExtractionError } from '../utils/SchemaExtractionError.js';
/**
 * Default glob patterns to watch for schema changes.
 * Covers the sanity config file and common schema directory naming conventions.
 */ const DEFAULT_SCHEMA_PATTERNS = [
    'sanity.config.{js,jsx,ts,tsx,mjs}',
    'schema*/**/*.{js,jsx,ts,tsx,mjs}'
];
/** Default debounce delay in milliseconds */ const DEFAULT_DEBOUNCE_MS = 1000;
/**
 * Delay before initial extraction to allow Vite to finish startup
 * and avoid race conditions with module resolution.
 */ const INITIAL_EXTRACTION_DELAY_MS = 1000;
/**
 * Creates a Vite plugin that automatically extracts Sanity schema during development and build.
 *
 * **During development:**
 * The plugin performs an initial extraction when the dev server starts, then watches
 * for file changes and re-extracts the schema when relevant files are modified.
 *
 * **During build:**
 * The plugin extracts the schema once at the end of the build process, ensuring
 * the schema is always up-to-date when deploying.
 *
 * **How it works in dev mode:**
 * 1. Registers watch patterns with Vite's built-in file watcher
 * 2. Performs initial schema extraction when the server starts
 * 3. On file changes matching the patterns, triggers a debounced extraction
 * 4. Uses concurrency control to prevent overlapping extractions
 *
 * @param options - Configuration options for the plugin
 * @returns A Vite plugin configured for schema extraction
 *
 * @internal
 */ export function sanitySchemaExtractionPlugin(options) {
    const { additionalPatterns = [], configPath, debounceMs = DEFAULT_DEBOUNCE_MS, enforceRequiredFields = false, format = 'groq-type-nodes', output = console, outputPath: outputPathOption = 'schema.json', telemetryLogger, workDir: workDirOption, workspaceName } = options;
    const watchPatterns = [
        ...DEFAULT_SCHEMA_PATTERNS,
        ...additionalPatterns
    ];
    // Resolved after Vite config is available
    let resolvedWorkDir;
    let resolvedOutputPath;
    // State for concurrency control
    let isExtracting = false;
    let pendingExtraction = false;
    // Stats for telemetry
    const startTime = Date.now();
    const stats = {
        failedCount: 0,
        successfulDurations: []
    };
    const extractSchema = ()=>runSchemaExtraction({
            configPath,
            enforceRequiredFields,
            format,
            outputPath: resolvedOutputPath,
            workspace: workspaceName
        });
    /**
   * Runs extraction with concurrency control.
   * If extraction is already running, queues one more extraction to run after completion.
   */ async function runExtraction(isBuilding = false) {
        if (isExtracting) {
            pendingExtraction = true;
            return;
        }
        isExtracting = true;
        pendingExtraction = false;
        const extractionStartTime = Date.now();
        try {
            await extractSchema();
            if (isBuilding) {
                // TODO: Remove when we have better control over progress reporting in build
                output.log('');
            }
            output.log(logSymbols.success, `Extracted schema to ${outputPathOption}`);
            // add stats for the successful extraction run to use later for telemetry
            stats.successfulDurations.push(Date.now() - extractionStartTime);
        } catch (err) {
            output.error(logSymbols.error, `Extraction failed: ${err instanceof Error ? err.message : String(err)}`);
            if (err instanceof SchemaExtractionError && err.validation && err.validation.length > 0) {
                output.error(logSymbols.error, formatSchemaValidation(err.validation));
            }
            // track the failed extraction
            stats.failedCount++;
        } finally{
            isExtracting = false;
            // If a change came in during extraction, run again
            if (pendingExtraction) {
                pendingExtraction = false;
                await runExtraction();
            }
        }
    }
    const debouncedExtract = debounce(()=>{
        void runExtraction();
    }, debounceMs);
    const { isMatch } = createSchemaPatternMatcher(watchPatterns);
    const handleChange = (filePath)=>{
        if (isMatch(filePath, resolvedWorkDir)) {
            debouncedExtract();
        }
    };
    return {
        name: 'sanity/schema-extraction',
        configResolved (config) {
            // Resolve workDir from option or Vite's project root
            resolvedWorkDir = workDirOption ?? config.root;
            resolvedOutputPath = isAbsolute(outputPathOption) ? outputPathOption : path.join(resolvedWorkDir, outputPathOption);
        },
        configureServer (server) {
            const trace = telemetryLogger?.trace(SchemaExtractionWatchModeTrace);
            trace?.start();
            trace?.log({
                enforceRequiredFields,
                schemaFormat: format,
                step: 'started'
            });
            // Add schema patterns to Vite's watcher
            const absolutePatterns = watchPatterns.map((pattern)=>path.join(resolvedWorkDir, pattern));
            server.watcher.add(absolutePatterns);
            // Prepare function to log "stopped" event to trace and complete the trace
            const onClose = once(()=>{
                // Cancel any pending debounced extractions
                debouncedExtract.cancel();
                // Log telemetry if available
                if (trace) {
                    trace.log({
                        averageExtractionDuration: mean(stats.successfulDurations) || 0,
                        extractionFailedCount: stats.failedCount,
                        extractionSuccessfulCount: stats.successfulDurations.length,
                        step: 'stopped',
                        watcherDuration: Date.now() - startTime
                    });
                    trace.complete();
                }
                // Clean up process listeners (must always run, not just when trace exists)
                process.off('SIGTERM', onClose);
                process.off('SIGINT', onClose);
            });
            server.watcher.on('change', handleChange);
            server.watcher.on('add', handleChange);
            server.watcher.on('unlink', handleChange);
            // call the watcherClosed method when watcher is closed or when process is stopped/killed
            server.watcher.on('close', onClose);
            process.on('SIGTERM', onClose);
            process.on('SIGINT', onClose);
            // Run initial extraction after server is ready
            const startExtraction = ()=>{
                setTimeout(()=>{
                    // Notify about schema extraction enabled
                    output.info(logSymbols.info, 'Schema extraction enabled. Watching:');
                    for (const pattern of watchPatterns){
                        output.info(`  - ${pattern}`);
                    }
                    // Perform first extraction
                    void runExtraction();
                }, INITIAL_EXTRACTION_DELAY_MS);
            };
            if (server.httpServer) {
                server.httpServer.once('listening', startExtraction);
            } else {
                // Middleware mode - no HTTP server, run extraction immediately
                startExtraction();
            }
        },
        async buildEnd () {
            const trace = telemetryLogger?.trace(SchemaExtractedTrace);
            trace?.start();
            try {
                const start = Date.now();
                const schema = await extractSchema();
                output.log(logSymbols.success, `Extracted schema to ${outputPathOption} (${Date.now() - start}ms)`);
                trace?.log({
                    enforceRequiredFields,
                    schemaAllTypesCount: schema.length,
                    schemaDocumentTypesCount: schema.filter((type)=>type.type === 'document').length,
                    schemaFormat: format,
                    schemaTypesCount: schema.filter((type)=>type.type === 'type').length
                });
            } catch (err) {
                trace?.error(err);
                throw err;
            } finally{
                trace?.complete();
            }
        }
    };
}

//# sourceMappingURL=plugin-schema-extraction.js.map