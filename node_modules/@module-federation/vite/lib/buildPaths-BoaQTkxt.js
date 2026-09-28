//#region src/utils/buildPaths.ts
/**
* Rebase an import path for a bootstrap file that moved from root into `dir`.
*
* When entryFileNames places entries in a subdirectory (e.g. `static/js/`),
* the bootstrap file moves there too. Paths that resolved from the HTML root
* must resolve from the new directory instead.
*
* Cases: `/static/js/hostInit.js` → `./hostInit.js` (strip dir prefix)
*        `./src/main.tsx`          → `../../src/main.tsx` (climb back up for each dir level)
*        `https://cdn.example.com` → unchanged         (absolute URL)
*/
function rebaseImport(importSrc, dir) {
	if (!dir) return importSrc;
	if (isAbsoluteUrl(importSrc)) return importSrc;
	const normalizedDir = dir.replace(/^\/+|\/+$/g, "");
	if (!normalizedDir) return importSrc;
	const stripDirPrefix = (src, prefix) => {
		if (src === prefix) return "";
		if (src.startsWith(prefix + "/")) return src.slice(prefix.length);
	};
	const absoluteRemainder = stripDirPrefix(importSrc, "/" + normalizedDir);
	if (absoluteRemainder !== void 0) {
		const remainder = absoluteRemainder.replace(/^\/+/, "");
		return remainder ? "./" + remainder : "./";
	}
	const relativeRemainder = stripDirPrefix(importSrc, normalizedDir);
	if (relativeRemainder !== void 0) {
		const remainder = relativeRemainder.replace(/^\/+/, "");
		return remainder ? "./" + remainder : "./";
	}
	const upLevels = normalizedDir.split("/").filter(Boolean).length;
	const prefix = upLevels > 0 ? "../".repeat(upLevels) : "./";
	if (importSrc.startsWith("./")) return prefix + importSrc.slice(2);
	if (importSrc.startsWith("/")) return prefix + importSrc.slice(1);
	return prefix + importSrc;
}
function normalizePathForImport(path) {
	return path.replace(/\\/g, "/");
}
const EXTERNAL_URL_RE = /^(?:[a-z]+:|\/\/)/i;
function isAbsoluteUrl(src) {
	if (/^[a-z]:[\\/]/i.test(src)) return false;
	return EXTERNAL_URL_RE.test(src);
}
const HASH_PLACEHOLDER_RE = /(?:[._-]?\[hash(?::\d+)?\])/g;
function hasFileExtension(fileName) {
	return fileName.slice(Math.max(fileName.lastIndexOf("/"), fileName.lastIndexOf("\\")) + 1).lastIndexOf(".") > 0;
}
/**
* Resolve a bundler `filename` template that still contains `[hash]` placeholders
* into the concrete, stable file name Module Federation serves.
*
* The federation entries are emitted by us rather than hashed by the bundler, so
* the placeholder is dropped instead of being substituted. When stripping it also
* removes the extension (`mf-[hash:8]` → `mf`), `.js` is appended so the result
* stays a loadable module. The extension check deliberately looks at the basename
* only — a dotted directory (`assets/v1.2/entry`) must not be mistaken for one.
*/
function resolveHashPlaceholderFileName(fileName) {
	if (!fileName.includes("[hash")) return fileName;
	const normalized = fileName.replace(HASH_PLACEHOLDER_RE, "");
	return hasFileExtension(normalized) ? normalized : `${normalized}.js`;
}
//#endregion
export { resolveHashPlaceholderFileName as i, normalizePathForImport as n, rebaseImport as r, EXTERNAL_URL_RE as t };
