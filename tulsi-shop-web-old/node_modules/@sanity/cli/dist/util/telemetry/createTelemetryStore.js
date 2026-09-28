import { appendFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { generateTelemetryFilePath } from './generateTelemetryFilePath.js';
import { createLogger } from './logger.js';
import { telemetryStoreDebug } from './telemetryStoreDebug.js';
/**
 * Creates a file-based telemetry store with cached consent and reliable synchronous I/O.
 *
 * Key optimizations:
 * - Consent resolved once at creation and cached (vs checking on every emit)
 * - File path generated and directory created once during initialization
 * - Synchronous file writes to ensure events are captured even during process exit
 *
 * @param sessionId - Unique session identifier for file isolation
 * @param options - Configuration options
 * @returns TelemetryStore instance compatible with the telemetry interface
 *
 * @internal
 */ export function createTelemetryStore(sessionId, options) {
    telemetryStoreDebug('Creating telemetry store with sessionId: %s', sessionId);
    let cachedConsent = null;
    let filePath = null;
    let initComplete = false;
    const eventBuffer = [];
    const initializeConsent = async ()=>{
        if (cachedConsent) return;
        try {
            cachedConsent = await options.resolveConsent();
            telemetryStoreDebug('Cached consent status: %s', cachedConsent.status);
        } catch (error) {
            telemetryStoreDebug('Failed to initialize consent, treating as undetermined: %o', error);
            cachedConsent = {
                reason: 'fetchError',
                status: 'undetermined'
            };
        }
    };
    const initializeFilePath = async ()=>{
        if (filePath) return;
        try {
            filePath = await generateTelemetryFilePath(sessionId);
            telemetryStoreDebug('Generated file path: %s', filePath);
            await mkdir(dirname(filePath), {
                recursive: true
            });
            telemetryStoreDebug('Created directory structure for: %s', filePath);
        } catch (error) {
            telemetryStoreDebug('Failed to initialize file path: %o', error);
            filePath = null;
        }
    };
    const writeEvent = (event)=>{
        if (!filePath) {
            telemetryStoreDebug('No file path, skipping event: %s', event.type);
            return;
        }
        telemetryStoreDebug('Emitting event: %s', event.type);
        try {
            // We use synchronous file writes to ensure telemetry events are captured even when
            // the process exits abruptly (process.exit, uncaught exceptions, SIGTERM, etc.).
            // The performance impact is probably negligible and is worth the trade-off
            // for 100% reliability. Async writes would be lost when the event loop
            // shuts down during process exit.
            appendFileSync(filePath, JSON.stringify(event) + '\n', 'utf8');
            telemetryStoreDebug('Successfully wrote event to file: %s', filePath);
        } catch (error) {
            telemetryStoreDebug('Failed to write telemetry event: %o', error);
        // Silent failure - don't break CLI functionality
        }
    };
    const emit = (event)=>{
        if (!initComplete) {
            telemetryStoreDebug('Init pending, buffering event: %s', event.type);
            eventBuffer.push(event);
            return;
        }
        if (!cachedConsent || cachedConsent.status !== 'granted') {
            telemetryStoreDebug('Consent not granted (%s), skipping event: %s', cachedConsent?.status ?? 'unresolved', event.type);
            return;
        }
        writeEvent(event);
    };
    const logger = createLogger(sessionId, emit);
    // Initialize both consent and file path concurrently
    Promise.allSettled([
        initializeConsent(),
        initializeFilePath()
    ]).then((results)=>{
        for (const [index, result] of results.entries()){
            if (result.status === 'rejected') {
                const type = index === 0 ? 'consent' : 'file path';
                telemetryStoreDebug('Error initializing %s: %o', type, result.reason);
            }
        }
        initComplete = true;
        if (cachedConsent?.status === 'granted' && filePath) {
            telemetryStoreDebug('Flushing %d buffered event(s)', eventBuffer.length);
            for (const event of eventBuffer){
                writeEvent(event);
            }
        } else {
            telemetryStoreDebug('Discarding %d buffered event(s), consent: %s', eventBuffer.length, cachedConsent?.status ?? 'unresolved');
        }
        eventBuffer.length = 0;
    });
    return logger;
}

//# sourceMappingURL=createTelemetryStore.js.map