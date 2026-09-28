import { t as findSharedKey } from "./sharedKeyMatcher-DiUzRVH1.js";
import { c as readResponseTextBounded, n as neutralizeBrowserPreloadHelpers, s as fetchWithTimeout, t as SsrEntryHttpError } from "./ssrEntryLoader-BqzV2t-n.js";
//#region src/utils/ssrVmStrategy.ts
/**
* vm.SourceTextModule strategy for loading remote SSR entries.
*
* Unlike the temp-file strategy (which rewrites bare shared imports to
* host-resolved file:// paths at fetch time), this strategy evaluates the
* remote's ESM graph with `vm.SourceTextModule` in the current context and
* resolves bare imports through a linker, in order:
*
*  1. The host's federation share scope — `instance.loadShare(name)` on the
*     global `__FEDERATION__` instances. This restores real share-scope
*     semantics (version negotiation, loaded-first reuse) on the server.
*  2. The build-time `resolvedShared` file map (same source as the temp-file
*     strategy) as a fallback when no instance shares the package.
*  3. Plain host `import(specifier)` for everything else (node builtins,
*     packages the remote expects the host to provide).
*
* Requires Node with `--experimental-vm-modules`; callers must check
* `isVmStrategyAvailable()` and fall back to the temp-file strategy when the
* API is missing.
*/
let vmApiPromise;
async function getVmApi() {
	if (!vmApiPromise) vmApiPromise = (async () => {
		try {
			const vm = await import(
				/* @vite-ignore */
				"vm"
);
			if (typeof vm.SourceTextModule !== "function" || typeof vm.SyntheticModule !== "function") return null;
			return vm;
		} catch {
			return null;
		}
	})();
	return vmApiPromise;
}
async function isVmStrategyAvailable() {
	return await getVmApi() !== null;
}
function findVmSharedKey(specifier, shared) {
	return findSharedKey(specifier, shared);
}
function getFederationInstances() {
	return globalThis.__FEDERATION__?.__INSTANCES__ ?? [];
}
/**
* Resolve a bare specifier to a module namespace: share scope first, then the
* build-time resolvedShared file map, then plain host import.
*/
async function loadBareModule(specifier, options) {
	const owner = options.federationInstance;
	const instances = owner ? [owner] : getFederationInstances();
	for (const instance of instances) {
		if (typeof instance?.loadShare !== "function") continue;
		const shared = instance.options?.shared;
		const sharedKey = findVmSharedKey(specifier, shared);
		const shareConfig = sharedKey ? shared?.[sharedKey] : void 0;
		if (!shareConfig) continue;
		if (!(Array.isArray(shareConfig.scope) ? shareConfig.scope : [shareConfig.scope ?? "default"]).includes(options.shareScopeName)) continue;
		try {
			const factory = await instance.loadShare(specifier);
			if (typeof factory === "function") {
				const shared = factory();
				if (shared) return shared;
			}
		} catch {}
	}
	const resolvedPath = options.resolvedShared[specifier];
	if (resolvedPath) return import(
		/* @vite-ignore */
		`file://${resolvedPath}`
);
	return import(
		/* @vite-ignore */
		specifier
);
}
function createSyntheticModule(vm, specifier, namespace) {
	const source = namespace && typeof namespace === "object" ? namespace : { default: namespace };
	const exportNames = new Set(Object.keys(source));
	exportNames.add("default");
	const syntheticModule = new vm.SyntheticModule([...exportNames], () => {
		for (const exportName of exportNames) if (exportName === "default") syntheticModule.setExport("default", source.default !== void 0 ? source.default : namespace);
		else syntheticModule.setExport(exportName, source[exportName]);
	}, { identifier: `mf-shared:${specifier}` });
	return syntheticModule;
}
const httpModuleCache = /* @__PURE__ */ new Map();
const namespaceCache = /* @__PURE__ */ new Map();
const linkQueues = /* @__PURE__ */ new WeakMap();
const contextIds = /* @__PURE__ */ new WeakMap();
let nextContextId = 1;
function getContextId(context) {
	let id = contextIds.get(context);
	if (id === void 0) {
		id = nextContextId++;
		contextIds.set(context, id);
	}
	return id;
}
function getVmCacheContextKey(options) {
	return JSON.stringify([
		getContextId(options.cacheContext),
		options.shareScopeName,
		Object.entries(options.resolvedShared).sort(([left], [right]) => left.localeCompare(right))
	]);
}
function getBodyPreview(body) {
	return body.slice(0, 240).replace(/\s+/g, " ").trim();
}
async function fetchModuleSource(url, fetchTimeoutMs, fetchMaxBytes) {
	const res = await fetchWithTimeout(url, {}, fetchTimeoutMs);
	const text = await readResponseTextBounded(res, fetchMaxBytes ?? 10485760, url);
	if (!res.ok) throw new SsrEntryHttpError(url, res.status, res.statusText, getBodyPreview(text));
	return neutralizeBrowserPreloadHelpers(text);
}
function isHttpUrl(value) {
	return value.startsWith("http://") || value.startsWith("https://");
}
/** Resolve a specifier against the referencing module's URL; null for bare specifiers. */
function resolveSpecifierUrl(specifier, referencerUrl) {
	if (isHttpUrl(specifier)) return specifier;
	if (specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/")) return new URL(specifier, referencerUrl).href;
	return null;
}
function getHttpModule(vm, url, options) {
	const cacheKey = JSON.stringify([
		getVmCacheContextKey(options),
		options.fetchTimeoutMs ?? 1e4,
		options.fetchMaxBytes ?? 10485760,
		options.versionKey,
		url
	]);
	if (!httpModuleCache.has(cacheKey)) httpModuleCache.set(cacheKey, (async () => {
		const code = await fetchModuleSource(url, options.fetchTimeoutMs, options.fetchMaxBytes);
		return new vm.SourceTextModule(code, {
			identifier: url,
			initializeImportMeta(meta) {
				meta.url = url;
			},
			importModuleDynamically: (specifier, referencingModule) => importDynamically(vm, specifier, referencingModule, options)
		});
	})().catch((error) => {
		httpModuleCache.delete(cacheKey);
		throw error;
	}));
	return httpModuleCache.get(cacheKey);
}
async function linkModule(vm, specifier, referencingModule, options) {
	const url = resolveSpecifierUrl(specifier, referencingModule.identifier);
	if (url) return getHttpModule(vm, url, options);
	return createSyntheticModule(vm, specifier, await loadBareModule(specifier, options));
}
async function linkModuleGraph(module, linker, cacheContext) {
	const current = (linkQueues.get(cacheContext) ?? Promise.resolve()).catch(() => {}).then(async () => {
		if (module.status === "unlinked") await module.link(linker);
	});
	linkQueues.set(cacheContext, current);
	try {
		await current;
	} finally {
		if (linkQueues.get(cacheContext) === current) linkQueues.delete(cacheContext);
	}
}
async function importDynamically(vm, specifier, referencingModule, options) {
	const linker = (spec, referencer) => linkModule(vm, spec, referencer, options);
	const module = await linker(specifier, referencingModule);
	await linkModuleGraph(module, linker, options.cacheContext);
	if (module.status === "linked") await module.evaluate();
	return module;
}
/**
* Load and evaluate a remote SSR entry as a `vm.SourceTextModule` graph and
* return its namespace (the federation container with `init`/`get`).
* Returns null when the vm module APIs are unavailable.
*/
async function loadViaVmStrategy(entryUrl, options) {
	const vm = await getVmApi();
	if (!vm) return null;
	const cacheKey = `${getVmCacheContextKey(options)}::${options.versionKey}::${entryUrl}`;
	if (!namespaceCache.has(cacheKey)) namespaceCache.set(cacheKey, (async () => {
		const entryModule = await getHttpModule(vm, entryUrl, options);
		const linker = (specifier, referencingModule) => linkModule(vm, specifier, referencingModule, options);
		await linkModuleGraph(entryModule, linker, options.cacheContext);
		if (entryModule.status === "linked") await entryModule.evaluate();
		return entryModule.namespace;
	})().catch((error) => {
		namespaceCache.delete(cacheKey);
		throw error;
	}));
	return namespaceCache.get(cacheKey);
}
//#endregion
export { isVmStrategyAvailable, loadViaVmStrategy };
