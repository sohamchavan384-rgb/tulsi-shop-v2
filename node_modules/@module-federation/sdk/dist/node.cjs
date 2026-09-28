
//#region src/node.ts
const sdkImportCache = /* @__PURE__ */ new Map();
function importNodeModule(name) {
	if (!name) throw new Error("import specifier is required");
	if (sdkImportCache.has(name)) return sdkImportCache.get(name);
	const promise = new Function("name", `return import(name)`)(name).then((res) => res).catch((error) => {
		console.error(`Error importing module ${name}:`, error);
		sdkImportCache.delete(name);
		throw error;
	});
	sdkImportCache.set(name, promise);
	return promise;
}
const lazyLoaderHookFetch = async (input, init, loaderHook) => {
	const hook = (url, init) => {
		return loaderHook.lifecycle.fetch.emit(url, init);
	};
	const res = await hook(input, init || {});
	if (!res || !(res instanceof Response)) return fetch(input, init || {});
	return res;
};
const createScriptNode = typeof ENV_TARGET === "undefined" || ENV_TARGET !== "web" ? (url, cb, attrs, loaderHook) => {
	if (loaderHook?.createScriptHook) {
		const hookResult = loaderHook.createScriptHook(url);
		if (hookResult && typeof hookResult === "object" && "url" in hookResult) url = hookResult.url;
	}
	let urlObj;
	try {
		urlObj = new URL(url);
	} catch (e) {
		console.error("Error constructing URL:", e);
		cb(/* @__PURE__ */ new Error(`Invalid URL: ${e}`));
		return;
	}
	const getFetch = async () => {
		if (loaderHook?.fetch) return (input, init) => lazyLoaderHookFetch(input, init, loaderHook);
		return fetch;
	};
	const handleScriptFetch = async (f, urlObj) => {
		try {
			const res = await f(urlObj.href);
			const data = await res.text();
			const [path, vm] = await Promise.all([importNodeModule("path"), importNodeModule("vm")]);
			const scriptContext = {
				exports: {},
				module: { exports: {} }
			};
			const urlDirname = urlObj.pathname.split("/").slice(0, -1).join("/");
			const filename = path.basename(urlObj.pathname);
			const script = new vm.Script(`(function(exports, module, require, __dirname, __filename) {${data}\n})`, {
				filename,
				importModuleDynamically: vm.constants?.USE_MAIN_CONTEXT_DEFAULT_LOADER ?? importNodeModule
			});
			let requireFn;
			requireFn = eval("require");
			script.runInThisContext()(scriptContext.exports, scriptContext.module, requireFn, urlDirname, filename);
			const exportedInterface = scriptContext.module.exports || scriptContext.exports;
			if (attrs && exportedInterface && attrs["globalName"]) {
				cb(void 0, exportedInterface[attrs["globalName"]] || exportedInterface);
				return;
			}
			cb(void 0, exportedInterface);
		} catch (e) {
			cb(e instanceof Error ? e : /* @__PURE__ */ new Error(`Script execution error: ${e}`));
		}
	};
	getFetch().then(async (f) => {
		if (attrs?.["type"] === "esm" || attrs?.["type"] === "module") return loadModule(urlObj.href, {
			fetch: f,
			vm: await importNodeModule("vm")
		}).then(async (module) => {
			await module.evaluate();
			cb(void 0, module.namespace);
		}).catch((e) => {
			cb(e instanceof Error ? e : /* @__PURE__ */ new Error(`Script execution error: ${e}`));
		});
		handleScriptFetch(f, urlObj);
	}).catch((err) => {
		cb(err);
	});
} : (url, cb, attrs, loaderHook) => {
	cb(/* @__PURE__ */ new Error("createScriptNode is disabled in non-Node.js environment"));
};
const loadScriptNode = typeof ENV_TARGET === "undefined" || ENV_TARGET !== "web" ? (url, info) => {
	return new Promise((resolve, reject) => {
		createScriptNode(url, (error, scriptContext) => {
			if (error) reject(error);
			else {
				const remoteEntryKey = info?.attrs?.["globalName"] || `__FEDERATION_${info?.attrs?.["name"]}:custom__`;
				resolve(globalThis[remoteEntryKey] = scriptContext);
			}
		}, info.attrs, info.loaderHook);
	});
} : (url, info) => {
	throw new Error("loadScriptNode is disabled in non-Node.js environment");
};
const esmModuleCache = /* @__PURE__ */ new Map();
const isFetchableRemoteModuleUrl = (url) => url.startsWith("http:") || url.startsWith("https:");
const isBareModuleSpecifier = (specifier) => !specifier.startsWith("./") && !specifier.startsWith("../") && !specifier.startsWith("/") && !specifier.includes(":");
function encodeRemoteModulePath(url) {
	const remoteUrl = new URL(url);
	const encodedProtocol = encodeURIComponent(remoteUrl.protocol.slice(0, -1));
	const encodedHost = encodeURIComponent(remoteUrl.host);
	const encodedPathname = remoteUrl.pathname.split("/").map((segment) => encodeURIComponent(segment)).join("/");
	const encodedSearchHash = encodeURIComponent(`${remoteUrl.search}${remoteUrl.hash}`);
	return `/${encodedProtocol}/${encodedHost}${encodedPathname}${encodedSearchHash ? `/${encodedSearchHash}` : ""}`;
}
function createImportMetaUrl(url, baseFileUrl) {
	const baseUrl = baseFileUrl.endsWith("/") ? baseFileUrl : `${baseFileUrl}/`;
	return new URL(`__module_federation_remote__${encodeRemoteModulePath(url)}`, baseUrl).href;
}
async function isNodeBuiltinSpecifier(specifier) {
	if (specifier.startsWith("node:")) return true;
	if (!isBareModuleSpecifier(specifier)) return false;
	return (await importNodeModule("node:module")).builtinModules.includes(specifier);
}
function getSyntheticModuleExports(moduleExports) {
	const namespaceObject = moduleExports && (typeof moduleExports === "object" || typeof moduleExports === "function") ? moduleExports : { default: moduleExports };
	const effectiveExports = { ...namespaceObject };
	if (!Object.prototype.hasOwnProperty.call(effectiveExports, "default")) effectiveExports.default = namespaceObject;
	return effectiveExports;
}
async function createSyntheticModuleFromExports(identifier, moduleExports, vm) {
	if (typeof vm.SyntheticModule !== "function") throw new Error("vm.SyntheticModule is required to load Node.js built-in modules in ESM remote entries.");
	const effectiveExports = getSyntheticModuleExports(moduleExports);
	const exportNames = Object.keys(effectiveExports);
	const syntheticModule = new vm.SyntheticModule(exportNames, function setSyntheticModuleExports() {
		for (const name of exportNames) this.setExport(name, effectiveExports[name]);
	}, { identifier });
	esmModuleCache.set(identifier, syntheticModule);
	await syntheticModule.link(async () => {
		throw new Error(`Node.js built-in module "${identifier}" should not request child modules.`);
	});
	await syntheticModule.evaluate();
	return syntheticModule;
}
async function loadNodeBuiltinModule(specifier, vm) {
	const cacheKey = `node-builtin:${specifier}`;
	if (esmModuleCache.has(cacheKey)) return esmModuleCache.get(cacheKey);
	return createSyntheticModuleFromExports(cacheKey, await importNodeModule(specifier), vm);
}
async function loadResolvedModule(specifier, parentUrl, options) {
	if (await isNodeBuiltinSpecifier(specifier)) return loadNodeBuiltinModule(specifier, options.vm);
	if (isBareModuleSpecifier(specifier)) throw new Error(`Unsupported ESM module specifier "${specifier}". Only relative or absolute http(s) remote modules and Node.js built-in modules are supported.`);
	const resolvedUrl = new URL(specifier, parentUrl).href;
	if (!isFetchableRemoteModuleUrl(resolvedUrl)) throw new Error(`Unsupported ESM module specifier "${specifier}" resolved to "${resolvedUrl}". Only http(s) remote modules and Node.js built-in modules are supported.`);
	return loadModule(resolvedUrl, options);
}
async function evaluateDynamicModule(module) {
	if (module.status === "linked") await module.evaluate();
	if (module.status === "errored") throw module.error;
	return module;
}
async function loadModule(url, options) {
	if (esmModuleCache.has(url)) return esmModuleCache.get(url);
	const { fetch, vm } = options;
	if (!isFetchableRemoteModuleUrl(url)) throw new Error(`Unsupported ESM module URL "${url}". Only http(s) remote modules and Node.js built-in modules are supported.`);
	const code = await (await fetch(url)).text();
	const cwdFileUrl = (await importNodeModule("node:url")).pathToFileURL(process.cwd()).href;
	const sourceTextModule = new vm.SourceTextModule(code, {
		identifier: url,
		initializeImportMeta: (meta) => {
			meta.url = createImportMetaUrl(url, cwdFileUrl);
		},
		importModuleDynamically: async (specifier) => {
			return evaluateDynamicModule(await loadResolvedModule(specifier, url, options));
		}
	});
	esmModuleCache.set(url, sourceTextModule);
	await sourceTextModule.link(async (specifier) => {
		return loadResolvedModule(specifier, url, options);
	});
	return sourceTextModule;
}

//#endregion
exports.createScriptNode = createScriptNode;
exports.loadScriptNode = loadScriptNode;
//# sourceMappingURL=node.cjs.map