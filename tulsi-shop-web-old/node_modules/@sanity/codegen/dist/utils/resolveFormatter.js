import { debug } from './debug.js';
// Wrapper to avoid lint rule against dynamic imports
// eslint-disable-next-line no-restricted-syntax
const tryImport = (specifier)=>import(specifier);
/**
 * Synchronously defines a formatter based on the `formatGeneratedCode` configuration.
 * The `name` is available immediately; call `resolve()` to load the formatter (which may throw).
 *
 * Returns `undefined` if `formatGeneratedCode` is `false`.
 *
 * @param formatGeneratedCode - The formatter mode to resolve
 */ export function defineFormatter(formatGeneratedCode) {
    if (formatGeneratedCode === false) {
        return undefined;
    }
    if (formatGeneratedCode === 'oxfmt') {
        return {
            name: 'oxfmt',
            resolve: resolveOxfmt
        };
    }
    // true or 'prettier' → use prettier
    return {
        name: 'prettier',
        resolve: resolvePrettier
    };
}
/**
 * Resolves a code formatter based on the `formatGeneratedCode` configuration.
 *
 * Resolution:
 * - `false` → no formatter
 * - `true` | `'prettier'` → prettier (always available as a dependency)
 * - `'oxfmt'` → oxfmt, throws if not installed
 *
 * @param formatGeneratedCode - The formatter mode to resolve
 */ export async function resolveFormatter(formatGeneratedCode) {
    const defined = defineFormatter(formatGeneratedCode);
    if (!defined) {
        return {
            format: undefined,
            name: undefined
        };
    }
    return defined.resolve();
}
async function resolveOxfmt() {
    try {
        const oxfmt = await tryImport('oxfmt');
        const format = oxfmt.format ?? oxfmt.default?.format;
        if (typeof format !== 'function') {
            throw new TypeError('oxfmt module does not export a format function');
        }
        return {
            format: async (filename, text)=>{
                const result = await format(filename, text);
                if (result.errors && result.errors.length > 0) {
                    throw new Error('Failed to format generated code with oxfmt', {
                        cause: result.errors
                    });
                }
                return result.code;
            },
            name: 'oxfmt'
        };
    } catch (err) {
        throw new Error('formatGeneratedCode is set to "oxfmt" but oxfmt could not be loaded. ' + 'Make sure oxfmt is installed as a dependency in your project. ' + 'See: https://oxc.rs/docs/guide/usage/formatter/quickstart.html', {
            cause: err
        });
    }
}
async function resolvePrettier() {
    try {
        const prettier = await tryImport('prettier');
        const format = prettier.format ?? prettier.default?.format;
        const resolveConfig = prettier.resolveConfig ?? prettier.default?.resolveConfig;
        if (typeof format !== 'function') {
            throw new TypeError('prettier module does not export a format function');
        }
        return {
            format: async (filename, text)=>{
                const prettierConfig = typeof resolveConfig === 'function' ? await resolveConfig(filename) : undefined;
                return format(text, {
                    ...prettierConfig,
                    parser: 'typescript'
                });
            },
            name: 'prettier'
        };
    } catch (err) {
        debug('prettier not available: %s', err instanceof Error ? err.message : err);
        return {
            format: undefined,
            name: undefined
        };
    }
}

//# sourceMappingURL=resolveFormatter.js.map