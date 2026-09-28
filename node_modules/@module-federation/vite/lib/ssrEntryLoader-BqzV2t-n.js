import { t as EXTERNAL_URL_RE } from "./buildPaths-BoaQTkxt.js";
//#region src/utils/fetchWithTimeout.ts
const DEFAULT_SSR_FETCH_TIMEOUT_MS = 1e4;
const DEFAULT_SSR_FETCH_MAX_BYTES = 10 * 1024 * 1024;
function getFetchUrl(input) {
	const raw = typeof input === "string" || input instanceof URL ? String(input) : input.url;
	return new URL(raw);
}
function getSecureFetchUrl(input) {
	const url = getFetchUrl(input);
	const isLoopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
	if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) throw new TypeError(`Refusing to fetch SSR resource over an insecure connection: ${url}`);
	return url;
}
function isAbortLikeError(error) {
	if (!error || typeof error !== "object") return false;
	const name = error.name;
	return name === "AbortError" || name === "TimeoutError";
}
/** Fetch with a bounded wait. Set timeoutMs to 0 to disable the timeout. */
async function fetchWithTimeout(input, init = {}, timeoutMs = DEFAULT_SSR_FETCH_TIMEOUT_MS) {
	const inputUrl = getSecureFetchUrl(input);
	const request = (target) => {
		const requestInit = {
			...init,
			redirect: "error"
		};
		if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return fetch(target.href, requestInit);
		const timeoutSignal = AbortSignal.timeout(timeoutMs);
		const signal = init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
		return fetch(target.href, {
			...requestInit,
			signal
		});
	};
	try {
		return await request(inputUrl);
	} catch (error) {
		if (inputUrl.hostname !== "localhost" || isAbortLikeError(error)) throw error;
		inputUrl.hostname = "[::1]";
		return request(inputUrl);
	}
}
var SsrFetchBodyTooLargeError = class extends Error {
	url;
	maxBytes;
	declaredBytes;
	constructor(url, maxBytes, declaredBytes) {
		super(declaredBytes != null ? `SSR response from ${url} declared ${declaredBytes} bytes which exceeds the ${maxBytes}-byte limit` : `SSR response from ${url} exceeded the ${maxBytes}-byte limit`);
		this.name = "SsrFetchBodyTooLargeError";
		this.url = url;
		this.maxBytes = maxBytes;
		this.declaredBytes = declaredBytes;
	}
};
function isSsrFetchBodyTooLargeError(error) {
	return error instanceof SsrFetchBodyTooLargeError;
}
/**
* Read a response body as text, rejecting when it exceeds `maxBytes`.
* Set `maxBytes` to 0 (or a non-finite value) to disable the limit.
*/
async function readResponseTextBounded(res, maxBytes = DEFAULT_SSR_FETCH_MAX_BYTES, url = res.url || "unknown") {
	if (!Number.isFinite(maxBytes) || maxBytes <= 0) return res.text();
	const contentLengthHeader = res.headers?.get?.("content-length") ?? null;
	if (contentLengthHeader != null) {
		const declaredBytes = Number(contentLengthHeader);
		if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
			try {
				await res.body?.cancel();
			} catch {}
			throw new SsrFetchBodyTooLargeError(url, maxBytes, declaredBytes);
		}
	}
	if (!res.body) return res.text();
	const reader = res.body.getReader();
	const chunks = [];
	let total = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (!value) continue;
		total += value.byteLength;
		if (total > maxBytes) {
			try {
				await reader.cancel();
			} catch {}
			throw new SsrFetchBodyTooLargeError(url, maxBytes);
		}
		chunks.push(value);
	}
	const merged = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(merged);
}
//#endregion
//#region src/utils/ssrEntryLoader.ts
/**
* MF runtime plugin that intercepts the `loadEntry` lifecycle hook on the
* server and loads the SSR-compatible remote entry instead of the browser one.
*
* This completely replaces the need for any `@module-federation/sdk` patches.
* The `loadEntry` hook is emitted by `runtime-core` before it falls through to
* `loadScriptNode` — if the hook returns a value, the runtime uses it directly.
*
* Strategy:
*  - In Node (detected through process.versions.node), fetch the remote's mf-manifest.json
*    to discover the ssrRemoteEntry URL and its type.
*  - ESM entry: use a dynamic `import()` — the SSR entry has no browser
*    globals and all shared packages are external.
*  - Dev mode (Vite 8+ only): use `ModuleRunner` with an HTTP transport backed
*    by the remote's `/__mf_runner__` endpoint. This fetches fully-transformed
*    module source through Vite's plugin pipeline, avoiding serialisation which
*    cannot faithfully represent React components or closures.
*
*    Dev mode on Vite < 8 is NOT supported by this integration because the
*    cross-process `fetchModule` proxy uses Vite 8's environment APIs.
*    `ModuleRunner` itself is available in earlier Vite versions, but an older
*    remote needs a different transport and server endpoint.
*
* Exported as a plain factory function so it can be serialised into the
* generated runtimePlugins list in virtualRemotes.ts.
*/
const importCache = /* @__PURE__ */ new Map();
async function nodeImport(id) {
	if (!importCache.has(id)) importCache.set(id, import(
		/* @vite-ignore */
		id
));
	return importCache.get(id);
}
const isNodeServer = () => {
	return import.meta.env?.SSR ?? typeof globalThis.process?.versions?.node === "string";
};
const runnerCache = /* @__PURE__ */ new Map();
function getSortedRecordEntries(record) {
	return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}
/**
* Load `vite/module-runner`. Returns null when the installed Vite does not
* expose the module-runner entry point.
*/
async function getModuleRunnerModule() {
	const moduleRunnerId = ["vite", "module-runner"].join("/");
	try {
		const { createRequire } = await nodeImport("module");
		return createRequire(import.meta.url)(moduleRunnerId);
	} catch {}
	try {
		return await nodeImport(moduleRunnerId);
	} catch {
		return null;
	}
}
/**
* Create a ModuleRunner that fetches modules from a remote Vite dev server's
* `/__mf_runner__` endpoint. Each HTTP POST carries a `fetchModule` invoke
* payload; the remote responds with the transformed module source as JSON.
*
* The cross-process transport is Vite 8+ only because older versions do not
* expose the `/__mf_runner__` environment proxy used here.
*/
function getRunnerCacheKey(remoteOrigin, resolvedShared, fetchTimeoutMs, fetchMaxBytes) {
	return JSON.stringify([
		remoteOrigin,
		fetchTimeoutMs,
		fetchMaxBytes,
		getSortedRecordEntries(resolvedShared)
	]);
}
async function resolveSharedExternal(id, resolvedShared) {
	if (typeof id !== "string") return null;
	const resolved = resolvedShared[id];
	if (!resolved) return null;
	if (EXTERNAL_URL_RE.test(resolved)) return {
		externalize: resolved,
		type: "module"
	};
	const { pathToFileURL } = await _url();
	return {
		externalize: pathToFileURL(resolved).href,
		type: "module"
	};
}
async function getOrCreateRunner(remoteOrigin, resolvedShared, fetchTimeoutMs, fetchMaxBytes) {
	const cacheKey = getRunnerCacheKey(remoteOrigin, resolvedShared, fetchTimeoutMs, fetchMaxBytes);
	const cached = runnerCache.get(cacheKey);
	if (cached) return cached.promise;
	const promise = (async () => {
		const viteRunner = await getModuleRunnerModule();
		if (!viteRunner) return null;
		const { ModuleRunner, ESModulesEvaluator } = viteRunner;
		const runnerEndpoint = `${remoteOrigin}/__mf_runner__`;
		try {
			return new ModuleRunner({
				hmr: false,
				transport: { async invoke(payload) {
					const text = await readResponseTextBounded(await fetchWithTimeout(runnerEndpoint, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload)
					}, fetchTimeoutMs), fetchMaxBytes, runnerEndpoint);
					const result = parseRunnerInvokeResult(JSON.parse(text));
					if ("error" in result && payload.data.name === "fetchModule") {
						const sharedExternal = await resolveSharedExternal(payload.data.data[0], resolvedShared);
						if (sharedExternal) return { result: sharedExternal };
					}
					return result;
				} }
			}, new ESModulesEvaluator());
		} catch {
			return null;
		}
	})();
	runnerCache.set(cacheKey, {
		remoteOrigin,
		promise
	});
	return promise;
}
const _path = () => nodeImport("path");
const _fs = () => nodeImport("fs");
const _crypto = () => nodeImport("crypto");
const _module = () => nodeImport("module");
const _url = () => nodeImport("url");
function isPlainObject(value) {
	return !!value && typeof value === "object" && !Array.isArray(value);
}
function parseManifestEntry(value) {
	if (!isPlainObject(value) || typeof value.name !== "string" || value.name.length === 0) return;
	return {
		name: value.name,
		path: typeof value.path === "string" ? value.path : "",
		type: typeof value.type === "string" ? value.type : "module"
	};
}
/** Network JSON is untyped until parsed. Keep the original object for version hashing. */
function parseManifest(data) {
	if (!isPlainObject(data)) return null;
	return data;
}
function parseRunnerInvokeResult(data) {
	if (!isPlainObject(data)) return { error: { message: "Invalid runner response" } };
	if ("error" in data) {
		const error = data.error;
		return { error: { message: isPlainObject(error) && typeof error.message === "string" ? error.message : "Unknown runner error" } };
	}
	if ("result" in data) return { result: data.result };
	return { result: data };
}
/**
* Version key for a resolved SSR entry. Derived from the remote's manifest
* content so a redeploy at the same URL produces a different key, which in
* turn produces different temp-file names — busting both our caches and
* Node's ESM module cache. Convention-resolved entries (no manifest) use a
* stable placeholder key for ordinary loads; explicit `revalidate()` calls
* advance a process-local generation so the next import is fresh.
*/
const UNVERSIONED = "unversioned";
const unversionedGenerations = /* @__PURE__ */ new Map();
let unversionedGlobalGeneration = 0;
function getUnversionedVersionKey(remoteEntryUrl) {
	return `${UNVERSIONED}-${unversionedGlobalGeneration}-${unversionedGenerations.get(remoteEntryUrl) ?? 0}`;
}
function bumpUnversionedGeneration(remoteEntryUrl) {
	unversionedGenerations.set(remoteEntryUrl, (unversionedGenerations.get(remoteEntryUrl) ?? 0) + 1);
}
function hashString(value) {
	let hash = 2166136261;
	for (let i = 0; i < value.length; i++) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(16).padStart(8, "0");
}
function computeManifestVersionKey(manifest) {
	const buildVersion = manifest.metaData?.buildInfo?.buildVersion;
	const contentHash = hashString(JSON.stringify(manifest));
	return buildVersion ? `${buildVersion}-${contentHash}` : contentHash;
}
const ssrEntryCache = /* @__PURE__ */ new Map();
const manifestFetchCache = /* @__PURE__ */ new Map();
function makeUrlCacheKey(url, fetchTimeoutMs, fetchMaxBytes) {
	return `${fetchTimeoutMs}::${fetchMaxBytes}::${url}`;
}
var SsrEntryHttpError = class extends Error {
	url;
	status;
	statusText;
	bodyPreview;
	constructor(url, status, statusText, bodyPreview) {
		super(`Failed to fetch SSR module "${url}": ${status} ${statusText}` + (bodyPreview ? `\npreview: ${bodyPreview}` : ""));
		this.url = url;
		this.status = status;
		this.statusText = statusText;
		this.bodyPreview = bodyPreview;
		this.name = "SsrEntryHttpError";
	}
};
function getBodyPreview(body) {
	return body.slice(0, 240).replace(/\s+/g, " ").trim();
}
function isSsrEntryHttpError(error) {
	return error instanceof SsrEntryHttpError;
}
async function fetchManifest(manifestUrl, fetchTimeoutMs, fetchMaxBytes) {
	try {
		const res = await fetchWithTimeout(manifestUrl, {}, fetchTimeoutMs);
		if (!res.ok) return null;
		const text = await readResponseTextBounded(res, fetchMaxBytes, manifestUrl);
		return parseManifest(JSON.parse(text));
	} catch (error) {
		if (isSsrFetchBodyTooLargeError(error)) throw error;
		return null;
	}
}
async function fetchManifestCached(manifestUrl, fetchTimeoutMs, fetchMaxBytes) {
	const cacheKey = makeUrlCacheKey(manifestUrl, fetchTimeoutMs, fetchMaxBytes);
	if (!manifestFetchCache.has(cacheKey)) {
		const promise = fetchManifest(manifestUrl, fetchTimeoutMs, fetchMaxBytes);
		manifestFetchCache.set(cacheKey, promise);
		promise.then((manifest) => {
			if (!manifest && manifestFetchCache.get(cacheKey) === promise) manifestFetchCache.delete(cacheKey);
		}, () => {
			if (manifestFetchCache.get(cacheKey) === promise) manifestFetchCache.delete(cacheKey);
		});
	}
	return manifestFetchCache.get(cacheKey);
}
/** True when the host configured a manifest URL as the remote entry (any .json name). */
function isManifestEntry(remoteEntryUrl) {
	try {
		const { pathname } = new URL(remoteEntryUrl);
		return /\.json$/i.test(pathname);
	} catch {
		return /\.json(?:[?#]|$)/i.test(remoteEntryUrl);
	}
}
function isSsrEntry(remoteEntryUrl) {
	return /\.ssr\.js(?:[?#].*)?$/.test(remoteEntryUrl);
}
function getManifestUrl(remoteEntryUrl) {
	if (isManifestEntry(remoteEntryUrl)) return remoteEntryUrl;
	return remoteEntryUrl.replace(/\/[^/]+$/, "/mf-manifest.json");
}
function getEntryFilename(entryUrl) {
	return entryUrl.split("/").pop()?.replace(/[?#].*$/, "").replace(/\.[^.]+$/, "") ?? "remoteEntry";
}
function resolveEntryAssetUrl(entry, manifestUrl) {
	const base = manifestUrl.replace(/\/[^/]+$/, "/");
	return new URL(`${entry.path || ""}${entry.name}`, base).href;
}
function resolveSSREntryUrl(manifest, manifestUrl) {
	const entry = parseManifestEntry(manifest.metaData?.ssrRemoteEntry);
	if (!entry) return null;
	const base = manifestUrl.replace(/\/[^/]+$/, "/");
	const entryPath = entry.path + entry.name;
	return {
		url: new URL(entryPath, base).href,
		type: entry.type,
		versionKey: computeManifestVersionKey(manifest)
	};
}
/**
* Derive the SSR entry URL by convention when no manifest is available.
* remoteEntry.js → remoteEntry.ssr.js
* remoteEntry.js → /__mf_ssr__/remoteEntry.ssr.js (dev middleware)
* Returns the first URL that responds with a 200.
*/
async function headCheckSsrEntry(candidate, fetchTimeoutMs) {
	try {
		const res = await fetchWithTimeout(candidate.url, { method: "HEAD" }, fetchTimeoutMs);
		const ct = res.headers.get("content-type") ?? "";
		if (res.ok && !ct.includes("text/html")) return candidate;
	} catch {}
	return null;
}
function resolveAssetBaseUrl(entryUrl, manifest, manifestUrl) {
	const remoteEntry = parseManifestEntry(manifest?.metaData?.remoteEntry);
	if (remoteEntry) return resolveEntryAssetUrl(remoteEntry, manifestUrl);
	if (!isManifestEntry(entryUrl)) return entryUrl;
	return new URL("remoteEntry.js", manifestUrl.replace(/\/[^/]+$/, "/")).href;
}
async function buildEntryContext(entryUrl, fetchTimeoutMs, fetchMaxBytes) {
	const manifestUrl = getManifestUrl(entryUrl);
	const manifest = await fetchManifestCached(manifestUrl, fetchTimeoutMs, fetchMaxBytes);
	const assetBaseUrl = resolveAssetBaseUrl(entryUrl, manifest, manifestUrl);
	return {
		entryUrl,
		manifestUrl,
		manifest,
		assetBaseUrl,
		filename: getEntryFilename(assetBaseUrl),
		remoteOrigin: assetBaseUrl.replace(/\/[^/]+$/, "")
	};
}
function buildSsrEntryCandidates(ctx, options = {}) {
	const { assetBaseUrl, filename, remoteOrigin } = ctx;
	const base = assetBaseUrl.replace(/\.[^.]+$/, "");
	const candidates = [];
	if (!options.skipServerBuild) candidates.push({
		url: `${remoteOrigin}/__mf_server__/${filename}.ssr.js`,
		type: "module",
		versionKey: getUnversionedVersionKey(ctx.entryUrl)
	});
	candidates.push({
		url: `${base}.ssr.js`,
		type: "module",
		versionKey: getUnversionedVersionKey(ctx.entryUrl)
	}, {
		url: `${remoteOrigin}/__mf_ssr__/${filename}.ssr.js`,
		type: "module",
		versionKey: getUnversionedVersionKey(ctx.entryUrl)
	});
	return candidates;
}
async function resolveFirstReachableCandidate(candidates, fetchTimeoutMs) {
	for (const candidate of candidates) {
		const hit = await headCheckSsrEntry(candidate, fetchTimeoutMs);
		if (hit) return hit;
	}
	return null;
}
async function resolveSSREntryImpl(remoteEntryUrl, fetchTimeoutMs, fetchMaxBytes) {
	if (isSsrEntry(remoteEntryUrl)) return {
		url: remoteEntryUrl,
		type: "module",
		versionKey: getUnversionedVersionKey(remoteEntryUrl)
	};
	if (!isManifestEntry(remoteEntryUrl)) {
		const filename = getEntryFilename(remoteEntryUrl);
		const fromServerBuild = await headCheckSsrEntry({
			url: `${remoteEntryUrl.replace(/\/[^/]+$/, "")}/__mf_server__/${filename}.ssr.js`,
			type: "module",
			versionKey: getUnversionedVersionKey(remoteEntryUrl)
		}, fetchTimeoutMs);
		if (fromServerBuild) return fromServerBuild;
	}
	const ctx = await buildEntryContext(remoteEntryUrl, fetchTimeoutMs, fetchMaxBytes);
	if (ctx.manifest) {
		const fromManifest = resolveSSREntryUrl(ctx.manifest, ctx.manifestUrl);
		if (fromManifest) return fromManifest;
	}
	return resolveFirstReachableCandidate(buildSsrEntryCandidates(ctx, { skipServerBuild: !isManifestEntry(remoteEntryUrl) }), fetchTimeoutMs);
}
function setSsrEntryCache(remoteEntryUrl, fetchTimeoutMs, fetchMaxBytes) {
	const cacheKey = makeUrlCacheKey(remoteEntryUrl, fetchTimeoutMs, fetchMaxBytes);
	const record = {
		promise: resolveSSREntryImpl(remoteEntryUrl, fetchTimeoutMs, fetchMaxBytes),
		resolvedAt: Date.now()
	};
	ssrEntryCache.set(cacheKey, record);
	record.promise.then((entry) => {
		if (!entry && ssrEntryCache.get(cacheKey) === record) ssrEntryCache.delete(cacheKey);
	}, () => {
		if (ssrEntryCache.get(cacheKey) === record) ssrEntryCache.delete(cacheKey);
	});
	return record;
}
async function getSSREntry(remoteEntryUrl, maxAgeMs, fetchTimeoutMs, fetchMaxBytes) {
	const cacheKey = makeUrlCacheKey(remoteEntryUrl, fetchTimeoutMs, fetchMaxBytes);
	const cached = ssrEntryCache.get(cacheKey);
	if (!cached) return setSsrEntryCache(remoteEntryUrl, fetchTimeoutMs, fetchMaxBytes).promise;
	if (!(typeof maxAgeMs === "number" && maxAgeMs >= 0 && Date.now() - cached.resolvedAt >= maxAgeMs)) return cached.promise;
	const previous = await cached.promise.catch(() => null);
	manifestFetchCache.delete(makeUrlCacheKey(getManifestUrl(remoteEntryUrl), fetchTimeoutMs, fetchMaxBytes));
	const record = setSsrEntryCache(remoteEntryUrl, fetchTimeoutMs, fetchMaxBytes);
	const next = await record.promise.catch(() => null);
	if (previous && next && previous.versionKey !== next.versionKey) dropRemoteCaches(remoteEntryUrl);
	return record.promise;
}
/**
* Drop per-remote caches after a version change so old artifacts stop being
* reused. Temp-file cache keys hold SSR entry/chunk URLs (not the browser
* entry URL), so scope the invalidation by origin.
*/
function dropRemoteCaches(remoteEntryUrl) {
	let origin;
	try {
		origin = new URL(remoteEntryUrl).origin;
	} catch {
		return;
	}
	for (const [key] of tempFileCache) if (JSON.parse(key).find((part) => typeof part === "string" && /^https?:\/\//.test(part))?.startsWith(origin)) {
		tempFileCache.delete(key);
		tempFilePathCache.delete(key);
	}
}
function clearRunnerCaches(remoteEntryUrl) {
	let remoteOrigin;
	if (remoteEntryUrl) try {
		remoteOrigin = new URL(remoteEntryUrl).origin;
	} catch {
		return;
	}
	for (const cached of runnerCache.values()) {
		if (remoteOrigin && cached.remoteOrigin !== remoteOrigin) continue;
		cached.promise.then((runner) => runner?.clearCache?.()).catch(() => {});
	}
}
/**
* Drop the loader's caches so the next `loadEntry` re-resolves and re-fetches
* remote SSR entries. Pass a remote entry URL to scope the invalidation to one
* remote; call with no arguments to invalidate everything.
*
* Note: the MF runtime keeps its own container/module caches per federation
* instance. This function best-effort clears the module caches of all global
* federation instances so re-renders load fresh remote modules, but hosts that
* hold direct references to previously loaded modules keep those references.
*/
function revalidate(remoteEntryUrl) {
	if (remoteEntryUrl) {
		bumpUnversionedGeneration(remoteEntryUrl);
		for (const key of ssrEntryCache.keys()) if (key.endsWith(`::${remoteEntryUrl}`)) ssrEntryCache.delete(key);
		const manifestUrl = getManifestUrl(remoteEntryUrl);
		for (const key of manifestFetchCache.keys()) if (key.endsWith(`::${manifestUrl}`)) manifestFetchCache.delete(key);
		dropRemoteCaches(remoteEntryUrl);
	} else {
		unversionedGlobalGeneration += 1;
		ssrEntryCache.clear();
		manifestFetchCache.clear();
		tempFileCache.clear();
		tempFilePathCache.clear();
	}
	clearRunnerCaches(remoteEntryUrl);
	const federation = globalThis.__FEDERATION__;
	for (const instance of federation?.__INSTANCES__ ?? []) try {
		instance?.moduleCache?.clear?.();
	} catch {}
}
const tempFileCache = /* @__PURE__ */ new Map();
const tempFilePathCache = /* @__PURE__ */ new Map();
function getSsrTransformContextKey(resolvedShared, shareScopeName) {
	return JSON.stringify([shareScopeName, getSortedRecordEntries(resolvedShared)]);
}
let ssrCacheDirPromise;
async function getSSRCacheDir() {
	if (!ssrCacheDirPromise) ssrCacheDirPromise = (async () => {
		const { join } = await _path();
		const { rmSync } = await _fs();
		const dir = join(process.cwd(), "node_modules", ".ssr-cache", String(process.pid));
		process.once("exit", () => {
			try {
				rmSync(dir, {
					recursive: true,
					force: true
				});
			} catch {}
		});
		return dir;
	})();
	return ssrCacheDirPromise;
}
/**
* Neutralize browser-only preload machinery in Vite/Rolldown output so the
* code can evaluate in Node. Shared by the temp-file and vm strategies.
*/
function neutralizeBrowserPreloadHelpers(code) {
	code = code.replace(/import\s*\{([^}]*)\}\s*from\s*["'][^"']*preload-helper[^"']*["'];?/g, (_m, bindings) => {
		return bindings.split(",").map((b) => {
			const parts = b.trim().split(/\s+as\s+/);
			return (parts[1] ?? parts[0]).trim();
		}).filter(Boolean).map((l) => `const ${l} = (fn) => fn();`).join("\n");
	});
	code = code.replace(/__vite__mapDeps\([^)]+\)/g, "[]");
	code = code.replace(/\b([A-Za-z_$][\w$]*)\s*\(\s*\(\s*\)\s*=>\s*import\(([^)]*)\)\s*,\s*\[\]\s*\)/g, "import($2)");
	return code;
}
function transformSsrCode(code, base, sharedPkgMap) {
	code = code.replace(/((?:from|export\s*\*\s*from)\s*)(["'`])(\.\.?\/[^"'`\s][^"'`]*)["'`]/g, (_m, prefix, _q, specifier) => `${prefix}"${new URL(specifier, base).href}"`);
	code = code.replace(/(import\s*)(["'`])(\.\.?\/[^"'`\s][^"'`]*)["'`]/g, (_m, prefix, _q, specifier) => `${prefix}"${new URL(specifier, base).href}"`);
	code = code.replace(/(import\s*\(\s*)(["'`])(\.\.?\/[^"'`\s][^"'`]*)["'`](\s*\))/g, (_m, prefix, _q, specifier, suffix) => `${prefix}"${new URL(specifier, base).href}"${suffix}`);
	if (sharedPkgMap && sharedPkgMap.size > 0) code = code.replace(/(?:from|import\s*\()\s*(["'`])([^"'`./][^"'`]*)["'`]/g, (m, _q, specifier) => {
		const resolved = sharedPkgMap.get(specifier);
		return resolved ? m.replace(specifier, `file://${resolved}`) : m;
	});
	return neutralizeBrowserPreloadHelpers(code);
}
function isVitePreloadHelperSpecifier(specifier) {
	return specifier.includes("preload-helper");
}
function getTempFileImportUrl(filePath, versionKey) {
	return `file://${filePath}?v=${encodeURIComponent(versionKey)}`;
}
/**
* Fetch an HTTP ESM module, transform it, write it to a temp .js file and
* return the file path. Recursively does the same for HTTP transitive imports
* so that `import('file:///...temp.js')` can resolve them.
*
* `versionKey` participates in both the cache key and the temp file name, so
* a remote redeploy (new manifest → new key) produces new files and bypasses
* Node's ESM module cache instead of serving the stale build.
*/
async function fetchEsmToTempFile(url, tmpDir, visited, pending, sharedPkgMap, versionKey = UNVERSIONED, fetchTimeoutMs = DEFAULT_SSR_FETCH_TIMEOUT_MS, contextKey = "default", fetchMaxBytes = DEFAULT_SSR_FETCH_MAX_BYTES) {
	const cacheKey = JSON.stringify([
		fetchTimeoutMs,
		fetchMaxBytes,
		versionKey,
		url,
		contextKey
	]);
	if (visited.has(url)) return visited.get(url);
	const cached = tempFileCache.get(cacheKey);
	if (cached) {
		pending.add(cached);
		const reserved = tempFilePathCache.get(cacheKey);
		const tmpFile = reserved ? await reserved : await cached;
		visited.set(url, tmpFile);
		return tmpFile;
	}
	const tmpFilePromise = (async () => {
		const { createHash } = await _crypto();
		const { join } = await _path();
		return join(tmpDir, `${createHash("sha1").update(cacheKey).digest("hex").slice(0, 12)}.js`);
	})();
	tempFilePathCache.set(cacheKey, tmpFilePromise);
	const promise = (async () => {
		const tmpFile = await tmpFilePromise;
		visited.set(url, tmpFile);
		const res = await fetchWithTimeout(url, {}, fetchTimeoutMs);
		let code = await readResponseTextBounded(res, fetchMaxBytes, url);
		if (!res.ok) throw new SsrEntryHttpError(url, res.status, res.statusText, getBodyPreview(code));
		const base = url.replace(/\/[^/]*$/, "/");
		const relImports = [];
		const relRegex = /(?:from|export\s*\*\s*from|import\s*\(?\s*)\s*["'`]([^"'`\s]+)["'`]/g;
		let m;
		while ((m = relRegex.exec(code)) !== null) if ((m[1].startsWith("./") || m[1].startsWith("../")) && !isVitePreloadHelperSpecifier(m[1])) relImports.push(new URL(m[1], base).href);
		const subMap = /* @__PURE__ */ new Map();
		await Promise.all([...new Set(relImports)].filter((u) => u.startsWith("http://") || u.startsWith("https://")).map(async (u) => {
			const tmpPath = await fetchEsmToTempFile(u, tmpDir, visited, pending, sharedPkgMap, versionKey, fetchTimeoutMs, contextKey, fetchMaxBytes);
			subMap.set(u, getTempFileImportUrl(tmpPath, versionKey));
		}));
		code = transformSsrCode(code, base, sharedPkgMap);
		for (const [httpUrl, fileUrl] of subMap) code = code.split(httpUrl).join(fileUrl);
		const { writeFileSync } = await _fs();
		writeFileSync(tmpFile, code, "utf8");
		return tmpFile;
	})();
	tempFileCache.set(cacheKey, promise);
	pending.add(promise);
	promise.catch(() => {
		if (tempFileCache.get(cacheKey) === promise) tempFileCache.delete(cacheKey);
		if (tempFilePathCache.get(cacheKey) === tmpFilePromise) tempFilePathCache.delete(cacheKey);
	});
	return promise;
}
async function fetchEsmGraphToTempFile(url, tmpDir, sharedPkgMap, versionKey = UNVERSIONED, fetchTimeoutMs = DEFAULT_SSR_FETCH_TIMEOUT_MS, contextKey = "default", fetchMaxBytes = DEFAULT_SSR_FETCH_MAX_BYTES) {
	const pending = /* @__PURE__ */ new Set();
	const rootFile = await fetchEsmToTempFile(url, tmpDir, /* @__PURE__ */ new Map(), pending, sharedPkgMap, versionKey, fetchTimeoutMs, contextKey, fetchMaxBytes);
	await Promise.all(pending);
	return rootFile;
}
async function importTempModule(filePath, versionKey) {
	return await import(
		/* @vite-ignore */
		`${filePath}?v=${encodeURIComponent(versionKey)}`
);
}
let warnedVmUnavailable = false;
async function tryVmStrategy(ssrEntry, options) {
	const { loadViaVmStrategy, isVmStrategyAvailable } = await import("./ssrVmStrategy-CkmYR5_u.js");
	if (!await isVmStrategyAvailable()) {
		if (!warnedVmUnavailable) {
			warnedVmUnavailable = true;
			console.warn("[mf-vite:ssr-entry-loader] strategy \"vm\" requires vm.SourceTextModule (run Node with --experimental-vm-modules); falling back to the temp-file strategy.");
		}
		return null;
	}
	return await loadViaVmStrategy(ssrEntry.url, {
		resolvedShared: options.resolvedShared,
		shareScopeName: options.shareScopeName,
		versionKey: ssrEntry.versionKey,
		fetchTimeoutMs: options.fetchTimeoutMs,
		fetchMaxBytes: options.fetchMaxBytes,
		cacheContext: options.cacheContext,
		federationInstance: options.federationInstance
	});
}
async function loadSSRRemoteEntry(ssrEntry, options) {
	const { url, type, versionKey } = ssrEntry;
	const { resolvedShared } = options;
	if (type === "commonjs-module" || type === "commonjs") {
		const { createRequire } = await _module();
		const req = createRequire(import.meta.url);
		try {
			return req(url);
		} catch {}
	}
	if (url.startsWith("http://") || url.startsWith("https://")) {
		const urlObj = new URL(url);
		if (urlObj.pathname.includes("/__mf_ssr__/")) {
			const remoteOrigin = urlObj.origin;
			const runner = await getOrCreateRunner(remoteOrigin, resolvedShared, options.fetchTimeoutMs, options.fetchMaxBytes);
			if (!runner) {
				if (process.env.NODE_ENV !== "production") return null;
			} else try {
				const mod = await runner.import(urlObj.pathname);
				if (mod && typeof mod === "object" && "init" in mod) return mod;
				if (process.env.NODE_ENV !== "production") return null;
			} catch (error) {
				if (isSsrFetchBodyTooLargeError(error)) throw error;
				if (process.env.NODE_ENV !== "production") return null;
			}
		}
		if (options.strategy === "vm") try {
			const fromVm = await tryVmStrategy(ssrEntry, options);
			if (fromVm) return fromVm;
		} catch (error) {
			if (isSsrEntryHttpError(error) || isSsrFetchBodyTooLargeError(error)) throw error;
		}
		const { mkdirSync } = await _fs();
		const cacheDir = await getSSRCacheDir();
		mkdirSync(cacheDir, { recursive: true });
		const sharedPkgMap = new Map(Object.entries(resolvedShared));
		try {
			return await importTempModule(await fetchEsmGraphToTempFile(url, cacheDir, sharedPkgMap, versionKey, options.fetchTimeoutMs, getSsrTransformContextKey(resolvedShared, options.shareScopeName), options.fetchMaxBytes), versionKey);
		} catch (error) {
			if (isSsrEntryHttpError(error) || isSsrFetchBodyTooLargeError(error)) throw error;
			return null;
		}
	}
	try {
		return await import(
			/* @vite-ignore */
			url
);
	} catch {
		return null;
	}
}
function ssrEntryLoaderPlugin(options = {}) {
	const resolved = {
		resolvedShared: options.resolvedShared ?? {},
		strategy: options.strategy ?? "temp-file",
		shareScopeName: options.shareScopeName ?? "default",
		maxAgeMs: options.maxAgeMs,
		fetchTimeoutMs: options.fetchTimeoutMs ?? 1e4,
		fetchMaxBytes: options.fetchMaxBytes ?? 10485760,
		cacheContext: {}
	};
	return {
		name: "mf-vite:ssr-entry-loader",
		async loadEntry({ remoteInfo, origin }) {
			if (!isNodeServer()) return;
			const loadOptions = origin ? {
				...resolved,
				cacheContext: origin,
				federationInstance: origin
			} : resolved;
			const ssrEntry = await getSSREntry(remoteInfo.entry, loadOptions.maxAgeMs, loadOptions.fetchTimeoutMs, loadOptions.fetchMaxBytes);
			if (!ssrEntry) return;
			const mod = await loadSSRRemoteEntry(ssrEntry, loadOptions);
			if (!mod) return;
			return mod;
		}
	};
}
//#endregion
export { DEFAULT_SSR_FETCH_MAX_BYTES as a, readResponseTextBounded as c, ssrEntryLoaderPlugin as i, neutralizeBrowserPreloadHelpers as n, DEFAULT_SSR_FETCH_TIMEOUT_MS as o, revalidate as r, fetchWithTimeout as s, SsrEntryHttpError as t };
