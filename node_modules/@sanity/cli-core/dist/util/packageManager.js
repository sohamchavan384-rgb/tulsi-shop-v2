/**
 * Runtime-detectable package managers (excludes 'manual' which is a UI-only choice).
 */ /**
 * Convenience wrapper that reads `process.env.npm_config_user_agent` and returns
 * the detected package manager.
 */ export function getRunningPackageManager() {
    return detectPackageManagerFromAgent();
}
/**
 * Extract the yarn major version from a `npm_config_user_agent` string.
 *
 * @param ua - User-agent string. Defaults to `process.env.npm_config_user_agent`.
 * @returns The major version number, or `undefined` if yarn isn't detected.
 */ export function getYarnMajorVersion(ua = process.env.npm_config_user_agent ?? '') {
    const match = ua.match(/yarn\/(\d+)/);
    return match ? Number.parseInt(match[1], 10) : undefined;
}
/**
 * Return the CLI invocation command for the detected (or provided) package manager.
 *
 * @param options - Optional `bin` (defaults to `'sanity'`) and `userAgent` override.
 * @returns A string like `"npx sanity"`, `"pnpm exec sanity"`, etc.
 */ export function getBinCommand(options) {
    const bin = options?.bin ?? 'sanity';
    const ua = options?.userAgent ?? process.env.npm_config_user_agent ?? '';
    const pm = detectPackageManagerFromAgent(ua);
    if (pm === 'npm') return `npx ${bin}`;
    if (pm === 'pnpm') return `pnpm exec ${bin}`;
    if (pm === 'bun') return `bunx ${bin}`;
    if (pm === 'yarn') {
        const major = getYarnMajorVersion(ua);
        if (major !== undefined && major >= 2) return `yarn run ${bin}`;
        return `yarn ${bin}`;
    }
    return bin;
}
/**
 * Parse the `npm_config_user_agent` string and return the detected package manager.
 *
 * The check order matters: yarn and pnpm set a user-agent that *also* contains
 * `npm/?`, so we must test for them before falling back to the anchored npm regex.
 *
 * @param ua - User-agent string. Defaults to `process.env.npm_config_user_agent`.
 * @returns The detected package manager, or `undefined` when unrecognisable.
 */ export function detectPackageManagerFromAgent(ua = process.env.npm_config_user_agent ?? '') {
    if (ua.includes('pnpm')) return 'pnpm';
    if (ua.includes('yarn')) return 'yarn';
    if (ua.includes('bun')) return 'bun';
    // Anchored regex: yarn/pnpm/bun agents also contain "npm/?" so we require
    // `npm/` followed by a digit to avoid false positives.
    if (/^npm\/\d/.test(ua)) return 'npm';
    return undefined;
}

//# sourceMappingURL=packageManager.js.map