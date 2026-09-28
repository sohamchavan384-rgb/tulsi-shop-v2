import { jsx as _jsx } from "react/jsx-runtime";
import { resolveLocalPackage, resolveLocalPackageFrom, resolveLocalPackagePath } from '@sanity/cli-core';
import { isValidElement } from 'react';
import { isValidElementType } from 'react-is';
/**
 * Resolves all runtime dependencies from the studio's working directory and
 * returns a React element ready for synchronous server-side rendering.
 *
 * Dependencies like ThemeProvider and sanity components must share the same
 * React instance as the server renderer to avoid dual-React dispatcher issues,
 * so they are resolved from the studio's workDir rather than the CLI's own deps.
 *
 * `\@sanity/ui` is a transitive dependency of sanity and may not be directly
 * accessible from the project root in strict package managers (pnpm, Yarn PnP).
 * We resolve it relative to the sanity package's location in node_modules.
 *
 * This function is async, but the returned element is a plain synchronous
 * component - no async server components required. This keeps compatibility
 * with both React 18 and React 19.
 */ async function resolveSchemaIcon({ icon, subtitle = '', title, workDir }) {
    // Resolve @sanity/ui via sanity's location, since it's a transitive dep
    // that may not be directly accessible from the project root (pnpm strict mode)
    const sanityUrl = resolveLocalPackagePath('sanity', workDir);
    const [{ ThemeProvider }, { buildTheme }, normalizedIcon] = await Promise.all([
        resolveLocalPackageFrom('@sanity/ui', sanityUrl),
        resolveLocalPackageFrom('@sanity/ui/theme', sanityUrl),
        normalizeIcon(icon, title, subtitle, workDir)
    ]);
    const theme = buildTheme();
    return /*#__PURE__*/ _jsx(ThemeProvider, {
        theme: theme,
        children: normalizedIcon
    });
}
async function normalizeIcon(Icon, title, subtitle, workDir) {
    if (isValidElementType(Icon)) return /*#__PURE__*/ _jsx(Icon, {});
    if (/*#__PURE__*/ isValidElement(Icon)) return Icon;
    const { createDefaultIcon } = await resolveLocalPackage('sanity', workDir);
    return createDefaultIcon(title, subtitle);
}
export { resolveSchemaIcon };

//# sourceMappingURL=resolveSchemaIcon.js.map