import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { subdebug } from '@sanity/cli-core';
import { parse as parseJsonc } from 'jsonc-parser';
import { parse as parseToml } from 'smol-toml';
import { createDetectionEnv, EDITOR_CONFIGS } from './editorConfigs.js';
const debug = subdebug('mcp:detectAvailableEditors');
/**
 * Safely parse config file content
 * Returns parsed config or null if unparseable
 */ function parseConfig(content, format) {
    const trimmed = content.trim();
    if (trimmed === '') {
        return {} // Empty file - safe to write, treat as empty config
        ;
    }
    if (format === 'toml') {
        try {
            const parsed = parseToml(content);
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                return null;
            }
            return parsed;
        } catch  {
            return null;
        }
    }
    const errors = [];
    const parsed = parseJsonc(content, errors, {
        allowTrailingComma: true
    });
    if (errors.length > 0 || typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return null // Parse failed
        ;
    }
    return parsed;
}
/**
 * Check if an editor's config is usable and whether Sanity MCP is already configured.
 * If configured, extracts the existing auth token.
 * Returns null only if config exists but can't be parsed (to avoid data loss).
 */ async function checkEditorConfig(name, configPath) {
    const { configKey, format, readToken } = EDITOR_CONFIGS[name];
    // Config file doesn't exist - can create it
    if (!existsSync(configPath)) {
        return {
            configPath,
            configured: false,
            name
        };
    }
    // Config exists - try to parse it
    try {
        const content = await fs.readFile(configPath, 'utf8');
        const config = parseConfig(content, format);
        if (config === null) {
            debug('Skipping %s: could not parse %s', name, configPath);
            return null // Can't parse - skip this editor
            ;
        }
        // Check if Sanity MCP is already configured
        const sanityConfig = config[configKey]?.Sanity;
        const configured = Boolean(sanityConfig);
        // Extract existing token if configured
        let existingToken;
        if (configured && typeof sanityConfig === 'object' && sanityConfig !== null) {
            existingToken = readToken(sanityConfig);
        }
        const { oauthOnly } = EDITOR_CONFIGS[name];
        if (configured && !existingToken && oauthOnly) {
            return {
                authStatus: 'valid',
                configPath,
                configured,
                name
            };
        }
        return {
            configPath,
            configured,
            existingToken,
            name
        };
    } catch (err) {
        debug('Skipping %s: could not read %s: %s', name, configPath, err);
        return null;
    }
}
/**
 * Detect which editors are installed and have parseable configs.
 * Editors with unparseable configs are skipped to avoid data loss.
 *
 * Accepts an optional `DetectionEnv` for testability. When omitted,
 * uses the real process/OS environment.
 */ export async function detectAvailableEditors(env) {
    const ctx = env ?? createDetectionEnv();
    // Detect all editors in parallel to avoid stacking timeouts —
    // CLI-based editors (Claude Code, Codex CLI, OpenCode) each have a
    // 5s execa timeout, so sequential detection can add ~15s on machines
    // where none are installed.
    const results = await Promise.all(Object.entries(EDITOR_CONFIGS).map(async ([name, config])=>{
        const configPath = await config.detect(ctx);
        if (!configPath) return null;
        return checkEditorConfig(name, configPath);
    }));
    return results.filter((editor)=>editor !== null);
}

//# sourceMappingURL=detectAvailableEditors.js.map