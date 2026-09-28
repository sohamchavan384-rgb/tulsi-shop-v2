//#region src/utils/pathNormalization.ts
const COMMON_SHARED_SUBPATHS = {
	react: [
		"react/jsx-runtime",
		"react/jsx-dev-runtime",
		"react/compiler-runtime"
	],
	"react-dom": ["react-dom/client", "react-dom/profiling"],
	"solid-js": [
		"solid-js/web",
		"solid-js/store",
		"solid-js/html",
		"solid-js/h",
		"solid-js/jsx-runtime",
		"solid-js/jsx-dev-runtime"
	],
	zustand: [
		"zustand/vanilla",
		"zustand/react",
		"zustand/middleware",
		"zustand/shallow"
	]
};
const VITE_DEFAULT_ASSET_TYPES = [
	"apng",
	"bmp",
	"png",
	"jpe?g",
	"jfif",
	"pjpeg",
	"pjp",
	"gif",
	"svg",
	"ico",
	"webp",
	"avif",
	"cur",
	"jxl",
	"mp4",
	"webm",
	"ogg",
	"mp3",
	"wav",
	"flac",
	"aac",
	"opus",
	"mov",
	"m4a",
	"vtt",
	"woff2?",
	"eot",
	"ttf",
	"otf",
	"webmanifest",
	"pdf",
	"txt"
];
const ASSET_LIKE_IMPORT_RE = new RegExp(`\\.(${[...[
	"css",
	"scss",
	"sass",
	"less",
	"styl",
	"stylus"
], ...VITE_DEFAULT_ASSET_TYPES].join("|")})(?:[?#].*)?$`, "i");
function isAssetLikeImport(source) {
	return ASSET_LIKE_IMPORT_RE.test(source);
}
const VITE_OPTIMIZABLE_ENTRY_RE = /\.[cm]?[jt]s$/;
function isViteOptimizableEntry(resolvedPath) {
	return VITE_OPTIMIZABLE_ENTRY_RE.test(resolvedPath);
}
function removeTrailingSlash(value) {
	return value.endsWith("/") ? value.slice(0, -1) : value;
}
function ensureTrailingSlash(value) {
	return `${removeTrailingSlash(value)}/`;
}
function getBasePath(base) {
	return removeTrailingSlash(base || "/");
}
function isNuxtClientBase(base) {
	return getBasePath(base).endsWith("/_nuxt");
}
function normalizeNodeModulePath(source) {
	const queryIndex = source.indexOf("?");
	return (queryIndex === -1 ? source : source.slice(0, queryIndex)).replace(/\\/g, "/");
}
function isNodeModulePath(source) {
	return source.includes("/node_modules/") || source.includes("\\node_modules\\");
}
function filterId(id) {
	return typeof id === "string" && !id.includes("\0");
}
const NODE_MODULE_FILE_EXT_RE = /^\.[cm]?[jt]sx?$/i;
function matchesNodeModuleCandidate(normalized, candidate) {
	const marker = `/node_modules/${candidate}`;
	let from = 0;
	while (from < normalized.length) {
		const index = normalized.indexOf(marker, from);
		if (index === -1) return false;
		const after = normalized.slice(index + marker.length);
		const boundary = after.search(/[?#]/);
		const afterPath = boundary === -1 ? after : after.slice(0, boundary);
		if (afterPath === "" || afterPath.startsWith("/") || NODE_MODULE_FILE_EXT_RE.test(afterPath)) return true;
		from = index + 1;
	}
	return false;
}
function getMatchingNodeModuleSubpath(source, candidates) {
	const normalized = normalizeNodeModulePath(source);
	return [...candidates].sort((a, b) => b.length - a.length).find((candidate) => matchesNodeModuleCandidate(normalized, candidate));
}
function getCommonSharedSubpaths(sharedKey) {
	return COMMON_SHARED_SUBPATHS[removeTrailingSlash(sharedKey)] || [];
}
function getCommonSharedSubpathFromNodeModulePath(source, sharedKey) {
	return getMatchingNodeModuleSubpath(source, getCommonSharedSubpaths(removeTrailingSlash(sharedKey)));
}
/**
* Resolves the public path for remote entries
* @param options - Module Federation options
* @param viteBase - Vite's base config value
* @param originalBase - Original base config before any transformations
* @returns The resolved public path
*/
function resolvePublicPath(options, viteBase, originalBase) {
	if (options.publicPath && options.publicPath !== "auto") return options.publicPath;
	if (!originalBase) return "auto";
	if (viteBase) {
		if (viteBase === "./") return "auto";
		return ensureTrailingSlash(viteBase);
	}
	return "auto";
}
//#endregion
//#region src/utils/sharedKeyMatcher.ts
function matchesSharedSource(source, key) {
	const keyBase = key.endsWith("/") ? key.slice(0, -1) : key;
	if (keyBase === "vue" && (source === "vue/dist/vue.esm-bundler.js" || source === "vue/dist/vue.runtime.esm-bundler.js")) return true;
	if (key.endsWith("/")) return source === keyBase || source.startsWith(`${keyBase}/`);
	if (getCommonSharedSubpaths(keyBase).includes(source)) return true;
	return source === keyBase;
}
const emptySharedKeyMatcher = { find: () => void 0 };
const sharedKeyMatcherCache = /* @__PURE__ */ new WeakMap();
function invalidateSharedKeyMatcher(shared) {
	sharedKeyMatcherCache.delete(shared);
}
function findSharedKey(source, shared) {
	return getSharedKeyMatcher(shared).find(source);
}
function pickLongestWildcardKey(wildcardKeys, source) {
	let best;
	for (const wildcard of wildcardKeys) {
		if (source !== wildcard.base && !source.startsWith(`${wildcard.base}/`)) continue;
		if (!best || wildcard.base.length > best.base.length || wildcard.base.length === best.base.length && wildcard.key.length > best.key.length) best = wildcard;
	}
	return best?.key;
}
function getSharedKeyMatcher(shared) {
	if (!shared) return emptySharedKeyMatcher;
	const cached = sharedKeyMatcherCache.get(shared);
	if (cached) return cached;
	const keys = Object.keys(shared);
	const exactKeys = new Set(keys);
	const commonSubpathKeys = /* @__PURE__ */ new Map();
	const wildcardKeys = [];
	let vueKey;
	for (const key of keys) {
		const keyBase = key.endsWith("/") ? key.slice(0, -1) : key;
		const shareItem = shared[key];
		if (!vueKey && keyBase === "vue") vueKey = key;
		if (key.endsWith("/")) wildcardKeys.push({
			key,
			base: keyBase
		});
		if (shareItem?.shareConfig?.import !== false) {
			for (const subpath of getCommonSharedSubpaths(keyBase)) if (!commonSubpathKeys.has(subpath)) commonSubpathKeys.set(subpath, key);
		}
	}
	const sourceCache = /* @__PURE__ */ new Map();
	const matcher = { find(source) {
		if (sourceCache.has(source)) return sourceCache.get(source);
		let result = exactKeys.has(source) ? source : void 0;
		if (!result && vueKey) {
			if (source === "vue/dist/vue.esm-bundler.js" || source === "vue/dist/vue.runtime.esm-bundler.js") result = vueKey;
		}
		if (!result) result = commonSubpathKeys.get(source);
		if (!result) result = pickLongestWildcardKey(wildcardKeys, source);
		sourceCache.set(source, result);
		return result;
	} };
	sharedKeyMatcherCache.set(shared, matcher);
	return matcher;
}
//#endregion
export { filterId as a, getCommonSharedSubpaths as c, isNodeModulePath as d, isNuxtClientBase as f, resolvePublicPath as h, ensureTrailingSlash as i, getMatchingNodeModuleSubpath as l, normalizeNodeModulePath as m, invalidateSharedKeyMatcher as n, getBasePath as o, isViteOptimizableEntry as p, matchesSharedSource as r, getCommonSharedSubpathFromNodeModulePath as s, findSharedKey as t, isAssetLikeImport as u };
