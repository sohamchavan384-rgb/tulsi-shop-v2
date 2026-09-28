import { existsSync, readFileSync, readdirSync } from "fs";
import { createRequire } from "module";
import * as path$1 from "node:path";
import { fileURLToPath, pathToFileURL } from "url";
//#region src/utils/logger.ts
const MODULE_FEDERATION_LOG_PREFIX = "[Module Federation]";
function formatModuleFederationMessage(message) {
	return `${MODULE_FEDERATION_LOG_PREFIX} ${message}`;
}
function createModuleFederationError(message) {
	return new Error(formatModuleFederationMessage(message));
}
function toConsoleArgs(message, rest = []) {
	if (typeof message === "string") return [formatModuleFederationMessage(message), ...rest];
	if (message === void 0) return [MODULE_FEDERATION_LOG_PREFIX, ...rest];
	return [
		MODULE_FEDERATION_LOG_PREFIX,
		message,
		...rest
	];
}
const moduleFederationConsole = {
	log(message, ...rest) {
		console.log(...toConsoleArgs(message, rest));
	},
	warn(message, ...rest) {
		console.warn(...toConsoleArgs(message, rest));
	},
	error(message, ...rest) {
		console.error(...toConsoleArgs(message, rest));
	}
};
const mfWarn = moduleFederationConsole.warn;
const mfError = moduleFederationConsole.error;
//#endregion
//#region src/utils/packageUtils.ts
const dependencyPresenceCache = /* @__PURE__ */ new Map();
let packageDetectionCwd;
function getDependencyCacheKey(cwd, dependencyName) {
	return `${cwd}:${dependencyName}`;
}
const installedPackageJsonCache = /* @__PURE__ */ new Map();
function setPackageDetectionCwd(cwd) {
	packageDetectionCwd = cwd;
}
function getPackageDetectionCwd() {
	return packageDetectionCwd || process.cwd();
}
function resolveImportPath(specifier) {
	const resolved = import.meta.resolve(specifier);
	if (!resolved.startsWith("file:")) return resolved;
	const filePath = fileURLToPath(resolved);
	if (!existsSync(filePath)) {
		const error = /* @__PURE__ */ new Error(`Cannot find module '${specifier}'`);
		error.code = "MODULE_NOT_FOUND";
		throw error;
	}
	return filePath;
}
const DEFAULT_EXPORT_CONDITIONS = [
	"browser",
	"import",
	"module",
	"default"
];
function resolveExportsEntry(exportsField, conditions = DEFAULT_EXPORT_CONDITIONS) {
	return resolveExportsEntryWithConditions(exportsField, new Set(conditions));
}
function resolveExportsEntryWithConditions(exportsField, conditions) {
	if (typeof exportsField === "string") return exportsField;
	if (!exportsField || typeof exportsField !== "object") return void 0;
	if (Array.isArray(exportsField)) {
		for (const target of exportsField) {
			const resolved = resolveExportsEntryWithConditions(target, conditions);
			if (resolved) return resolved;
		}
		return;
	}
	const record = exportsField;
	const rootExport = record["."];
	if (rootExport) return resolveExportsEntryWithConditions(rootExport, conditions);
	for (const [condition, value] of Object.entries(record)) {
		if (condition !== "default" && !conditions.has(condition)) continue;
		const target = resolveExportsEntryWithConditions(value, conditions);
		if (target) return target;
	}
}
function substituteExportsWildcard(target, patternMatch) {
	if (typeof target === "string") return target.split("*").join(patternMatch);
	if (Array.isArray(target)) return target.map((entry) => substituteExportsWildcard(entry, patternMatch));
	if (target && typeof target === "object") {
		const source = target;
		const out = {};
		for (const key of Object.keys(source)) out[key] = substituteExportsWildcard(source[key], patternMatch);
		return out;
	}
	return target;
}
function matchExportsSubpath(record, subpath) {
	if (subpath in record) return record[subpath];
	let bestKey;
	let bestBaseLength = -1;
	let bestKeyLength = -1;
	for (const key of Object.keys(record)) {
		const wildcardIndex = key.indexOf("*");
		if (wildcardIndex === -1) continue;
		const patternBase = key.slice(0, wildcardIndex);
		const patternTrailer = key.slice(wildcardIndex + 1);
		if (patternTrailer.includes("*")) continue;
		if (!subpath.startsWith(patternBase) || !subpath.endsWith(patternTrailer)) continue;
		if (subpath.length <= patternBase.length + patternTrailer.length) continue;
		if (patternBase.length > bestBaseLength || patternBase.length === bestBaseLength && key.length > bestKeyLength) {
			bestKey = key;
			bestBaseLength = patternBase.length;
			bestKeyLength = key.length;
		}
	}
	if (bestKey === void 0) return void 0;
	const patternTrailer = bestKey.slice(bestKey.indexOf("*") + 1);
	const patternMatch = subpath.slice(bestBaseLength, subpath.length - patternTrailer.length);
	return substituteExportsWildcard(record[bestKey], patternMatch);
}
function getPackageExportsTarget(pkg, packageName, exportsField) {
	if (typeof exportsField === "string") return pkg === packageName ? exportsField : void 0;
	if (!exportsField || typeof exportsField !== "object") return void 0;
	const record = exportsField;
	const subpath = pkg === packageName ? "." : `.${pkg.slice(packageName.length)}`;
	if (subpath !== ".") return matchExportsSubpath(record, subpath);
	return record["."] ?? (!Object.keys(record).some((key) => key.startsWith(".")) ? record : void 0);
}
/**
* Escaping rules:
* Convert using the format __${mapping}__, where _ and $ are not allowed in npm package names but can be used in variable names.
*  @ => 1
*  / => 2
*  - => 3
*  . => 4
*/
/**
* Encodes a package name into a valid file name.
* @param {string} name - The package name, e.g., "@scope/xx-xx.xx".
* @returns {string} - The encoded file name.
*/
function packageNameEncode(name) {
	if (typeof name !== "string") throw createModuleFederationError("A string package name is required");
	return name.replace(/@/g, "_mf_0_").replace(/\//g, "_mf_1_").replace(/-/g, "_mf_2_").replace(/\./g, "_mf_3_");
}
/**
* Decodes an encoded file name back to the original package name.
* @param {string} encoded - The encoded file name, e.g., "_mf_0_scope_mf_1_xx_mf_2_xx_mf_3_xx".
* @returns {string} - The decoded package name.
*/
function packageNameDecode(encoded) {
	if (typeof encoded !== "string") throw createModuleFederationError("A string encoded file name is required");
	return encoded.replace(/_mf_0_/g, "@").replace(/_mf_1_/g, "/").replace(/_mf_2_/g, "-").replace(/_mf_3_/g, ".");
}
/**
* Removes any subpath from an npm package specifier and returns the package name only.
* @param {string} packageString - The package specifier, e.g., "@scope/pkg/runtime" or "react/jsx-runtime".
* @returns {string} - The base npm package name.
*/
function getPackageName(packageString) {
	const match = packageString.match(/^(?:@[^/]+\/)?[^/]+/);
	return match ? match[0] : packageString;
}
function getPackageNameFromNodeModulePath(source) {
	const normalized = source.replace(/\\/g, "/");
	const nodeModulesIndex = normalized.lastIndexOf("/node_modules/");
	if (nodeModulesIndex < 0) return;
	const parts = normalized.slice(nodeModulesIndex + 14).split("/");
	if (!parts[0]) return;
	if (parts[0].startsWith("@")) return parts[1] ? `${parts[0]}/${parts[1]}` : void 0;
	return parts[0];
}
function getSharedCacheKeyParts(input) {
	const scope = (Array.isArray(input.scope) ? input.scope[0] : input.scope) || "default";
	const id = input.singleton || !input.version ? input.pkg : `${input.pkg}@${input.version}`;
	return {
		scope,
		id,
		key: `${scope}:${id}`
	};
}
function getSharedCacheDescriptor(pkg, shareItem) {
	const parts = getSharedCacheKeyParts({
		pkg,
		singleton: shareItem.shareConfig.singleton,
		version: shareItem.version,
		scope: shareItem.scope
	});
	return {
		canonical: parts.key,
		...parts.scope === "default" ? { aliases: [parts.id] } : {}
	};
}
const sharedCacheHelperCode = `const __mfGetSharedCacheDescriptor = (pkg, singleton, version, scope) => {
            const normalizedScope = Array.isArray(scope) ? scope[0] : scope;
            const scopeName = normalizedScope || "default";
            const id = singleton || !version ? pkg : pkg + "@" + version;
            const descriptor = { canonical: scopeName + ":" + id };
            if (scopeName === "default") descriptor.aliases = [id];
            return descriptor;
          };
          const __mfReadSharedCache = (cache, descriptor) => {
            const value = cache[descriptor.canonical];
            if (value !== undefined) return value;
            const aliases = descriptor.aliases || [];
            for (const alias of aliases) {
              if (!Object.prototype.hasOwnProperty.call(cache, alias)) continue;
              const aliasValue = cache[alias];
              if (aliasValue !== undefined) {
                cache[descriptor.canonical] = aliasValue;
                return aliasValue;
              }
            }
            return undefined;
          };
          const __mfSharedCacheListenersKey = Symbol.for("module-federation.shared-cache-listeners");
          const __mfGetSharedCacheListeners = (cache) => {
            let listeners = cache[__mfSharedCacheListenersKey];
            if (listeners === undefined) {
              listeners = Object.create(null);
              Object.defineProperty(cache, __mfSharedCacheListenersKey, {
                value: listeners,
                enumerable: false,
                configurable: false,
                writable: false
              });
            }
            return listeners;
          };
          const __mfSubscribeSharedCache = (cache, descriptor, listener) => {
            const listeners = __mfGetSharedCacheListeners(cache);
            (listeners[descriptor.canonical] ||= new Set()).add(listener);
          };
          const __mfSharedCacheOwnersKey = Symbol.for("module-federation.shared-cache-owners");
          const __mfGetSharedCacheOwners = (cache) => {
            let owners = cache[__mfSharedCacheOwnersKey];
            if (owners === undefined) {
              owners = Object.create(null);
              Object.defineProperty(cache, __mfSharedCacheOwnersKey, {
                value: owners,
                enumerable: false,
                configurable: false,
                writable: false
              });
            }
            return owners;
          };
          const __mfReadSharedCacheOwner = (cache, descriptor) =>
            cache[__mfSharedCacheOwnersKey]?.[descriptor.canonical];
          const __mfWriteSharedCache = (cache, descriptor, value, owner) => {
            cache[descriptor.canonical] = value;
            const aliases = descriptor.aliases || [];
            for (const alias of aliases) {
              Object.defineProperty(cache, alias, {
                value,
                enumerable: true,
                configurable: true,
                writable: true
              });
            }
            const owners = cache[__mfSharedCacheOwnersKey];
            if (owner === undefined) {
              if (owners) delete owners[descriptor.canonical];
            } else {
              __mfGetSharedCacheOwners(cache)[descriptor.canonical] = owner;
            }
            const listeners = cache[__mfSharedCacheListenersKey]?.[descriptor.canonical];
            if (listeners) {
              for (const listener of listeners) listener(value);
            }
            return value;
          };
          const __mfTreeShakingSharedCacheKey = Symbol.for("module-federation.tree-shaking-shared-cache");
          const __mfGetTreeShakingSharedCache = (cache) => {
            let metadata = cache[__mfTreeShakingSharedCacheKey];
            if (metadata === undefined) {
              metadata = Object.create(null);
              Object.defineProperty(cache, __mfTreeShakingSharedCacheKey, {
                value: metadata,
                enumerable: false,
                configurable: false,
                writable: false
              });
            }
            return metadata;
          };
          const __mfReadTreeShakingSharedCache = (cache, descriptor, requiredExports) => {
            const fullModule = __mfReadSharedCache(cache, descriptor);
            if (fullModule !== undefined) return fullModule;
            if (!Array.isArray(requiredExports)) return undefined;
            const metadata = cache[__mfTreeShakingSharedCacheKey];
            const entries = metadata?.[descriptor.canonical] || [];
            let compatibleEntry;
            for (const entry of entries) {
              if (!requiredExports.every((name) => entry.providedExports.includes(name))) continue;
              if (!compatibleEntry || entry.providedExports.length < compatibleEntry.providedExports.length) {
                compatibleEntry = entry;
              }
            }
            return compatibleEntry?.value;
          };
          const __mfWriteTreeShakingSharedCache = (cache, descriptor, providedExports, value) => {
            if (!Array.isArray(providedExports)) return value;
            const normalizedExports = [...new Set(providedExports)].sort();
            const metadata = __mfGetTreeShakingSharedCache(cache);
            const entries = (metadata[descriptor.canonical] ||= []);
            const existing = entries.find((entry) =>
              entry.providedExports.length === normalizedExports.length &&
              entry.providedExports.every((name, index) => name === normalizedExports[index])
            );
            if (existing) existing.value = value;
            else entries.push({ providedExports: normalizedExports, value });
            return value;
          };
          const __mfTreeShakingSelectionCacheKey = Symbol.for("module-federation.tree-shaking-shared-selection-cache");
          const __mfGetTreeShakingSelectionCache = (cache) => {
            let selections = cache[__mfTreeShakingSelectionCacheKey];
            if (selections === undefined) {
              selections = Object.create(null);
              Object.defineProperty(cache, __mfTreeShakingSelectionCacheKey, {
                value: selections,
                enumerable: false,
                configurable: false,
                writable: false
              });
            }
            return selections;
          };
          const __mfReadTreeShakingSharedSelection = (cache, descriptor, consumer) => {
            const fullModule = __mfReadSharedCache(cache, descriptor);
            if (fullModule !== undefined) return fullModule;
            return cache[__mfTreeShakingSelectionCacheKey]?.[descriptor.canonical]?.[consumer];
          };
          const __mfWriteTreeShakingSharedSelection = (cache, descriptor, consumer, value) => {
            const selections = __mfGetTreeShakingSelectionCache(cache);
            const byConsumer = (selections[descriptor.canonical] ||= Object.create(null));
            byConsumer[consumer] = value;
            return value;
          };`;
function getInstalledPackageJson(pkg, opts) {
	const cwd = opts?.cwd || getPackageDetectionCwd();
	const packageName = opts?.packageName || getPackageName(pkg);
	const cacheKey = `${cwd}\0${pkg}\0${packageName}\0${opts?.fromResolvedEntry ?? ""}`;
	if (installedPackageJsonCache.has(cacheKey)) return installedPackageJsonCache.get(cacheKey);
	const result = resolveInstalledPackageJson(pkg, cwd, packageName, opts);
	installedPackageJsonCache.set(cacheKey, result);
	return result;
}
function resolveInstalledPackageJson(pkg, cwd, packageName, opts) {
	const tryReadPackageJson = (packageJsonPath) => {
		if (!existsSync(packageJsonPath)) return void 0;
		try {
			return {
				path: packageJsonPath,
				dir: path$1.dirname(packageJsonPath),
				packageJson: JSON.parse(readFileSync(packageJsonPath, "utf-8"))
			};
		} catch {
			return;
		}
	};
	const findPackageInPnpmStore = (startDir) => {
		let currentDir = startDir;
		while (true) {
			const pnpmStoreDir = path$1.join(currentDir, "node_modules", ".pnpm");
			if (existsSync(pnpmStoreDir)) try {
				for (const entry of readdirSync(pnpmStoreDir, { withFileTypes: true })) {
					if (!entry.isDirectory()) continue;
					const candidate = tryReadPackageJson(path$1.join(pnpmStoreDir, entry.name, "node_modules", packageName, "package.json"));
					if (candidate?.packageJson.name === packageName) return candidate;
				}
			} catch {}
			const parentDir = path$1.dirname(currentDir);
			if (parentDir === currentDir) break;
			currentDir = parentDir;
		}
	};
	let resolvedPath;
	try {
		const projectRequire = createRequire(pathToFileURL(path$1.join(cwd, "package.json")));
		if (opts?.fromResolvedEntry) resolvedPath = opts.fromResolvedEntry;
		else try {
			resolvedPath = projectRequire.resolve(pkg);
		} catch {
			resolvedPath = projectRequire.resolve(packageName);
		}
	} catch {
		resolvedPath = void 0;
	}
	if (resolvedPath !== void 0 && !path$1.isAbsolute(resolvedPath)) resolvedPath = void 0;
	if (resolvedPath !== void 0) try {
		let currentDir = path$1.dirname(resolvedPath);
		let matchingPackage;
		while (true) {
			const packageJsonPath = path$1.join(currentDir, "package.json");
			if (existsSync(packageJsonPath)) {
				const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
				try {
					const packageJson = JSON.parse(packageJsonContent);
					if (packageJson.name === packageName) {
						const packageInfo = {
							path: packageJsonPath,
							dir: currentDir,
							packageJson
						};
						if (currentDir.endsWith(path$1.join("node_modules", packageName))) return packageInfo;
						matchingPackage ??= packageInfo;
					}
				} catch (error) {
					if (!(error instanceof SyntaxError)) throw error;
				}
			}
			const parentDir = path$1.dirname(currentDir);
			if (parentDir === currentDir) break;
			currentDir = parentDir;
		}
		return matchingPackage;
	} catch {}
	let currentDir = cwd;
	while (true) {
		const directCandidate = tryReadPackageJson(path$1.join(currentDir, "node_modules", packageName, "package.json"));
		if (directCandidate?.packageJson.name === packageName) return directCandidate;
		const parentDir = path$1.dirname(currentDir);
		if (parentDir === currentDir) break;
		currentDir = parentDir;
	}
	return findPackageInPnpmStore(cwd);
}
function getInstalledPackageEntry(pkg, opts) {
	const installed = getInstalledPackageJson(pkg, opts);
	if (!installed) return void 0;
	const cwd = opts?.cwd || getPackageDetectionCwd();
	const packageName = opts?.packageName || getPackageName(pkg);
	const packageJson = installed.packageJson;
	if (pkg !== packageName && (opts?.resolveSubpathWithRequire !== false || packageJson.exports === void 0)) try {
		return createRequire(pathToFileURL(path$1.join(cwd, "package.json"))).resolve(pkg);
	} catch {}
	const explicitEntry = resolveExportsEntry(getPackageExportsTarget(pkg, packageName, packageJson.exports), opts?.conditions) || (typeof packageJson.module === "string" ? packageJson.module : void 0) || (typeof packageJson.main === "string" ? packageJson.main : void 0) || "index.js";
	return path$1.join(installed.dir, explicitEntry);
}
/**
* Detect whether the current runtime is Vite 8+ by checking for a Vite version flag
* on the plugin hook context, with Rolldown metadata kept as a compatibility fallback.
*/
function getIsRolldown(ctx) {
	const viteVersion = ctx?.meta?.viteVersion;
	const viteMajor = Number(String(viteVersion ?? "").split(".")[0]);
	return Number.isFinite(viteMajor) && viteMajor >= 8 || !!ctx?.meta?.rolldownVersion;
}
/** Walk up from Vite `config.root` (Nuxt may point at `.nuxt` cache dirs). */
function isNuxtProjectRoot(root) {
	let dir = root;
	for (let i = 0; i < 8; i++) {
		if (hasPackageDependency("nuxt", dir) || hasPackageDependency("nuxt-nightly", dir)) return true;
		const parent = path$1.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return false;
}
function hasPackageDependency(dependencyName, cwd = packageDetectionCwd || process.cwd()) {
	const cacheKey = getDependencyCacheKey(cwd, dependencyName);
	const cached = dependencyPresenceCache.get(cacheKey);
	if (cached !== void 0) return cached;
	try {
		const packageJson = JSON.parse(readFileSync(path$1.join(cwd, "package.json"), "utf8"));
		const hasDependency = [
			packageJson.dependencies,
			packageJson.devDependencies,
			packageJson.peerDependencies,
			packageJson.optionalDependencies
		].some((deps) => !!deps?.[dependencyName]);
		dependencyPresenceCache.set(cacheKey, hasDependency);
		return hasDependency;
	} catch {
		dependencyPresenceCache.set(cacheKey, false);
		return false;
	}
}
//#endregion
//#region src/utils/dtsConstants.ts
const DEFAULT_PUBLIC_TYPES_FOLDER = "@mf-types";
//#endregion
export { mfError as _, getPackageDetectionCwd as a, getSharedCacheDescriptor as c, packageNameDecode as d, packageNameEncode as f, createModuleFederationError as g, sharedCacheHelperCode as h, getIsRolldown as i, hasPackageDependency as l, setPackageDetectionCwd as m, getInstalledPackageEntry as n, getPackageName as o, resolveImportPath as p, getInstalledPackageJson as r, getPackageNameFromNodeModulePath as s, DEFAULT_PUBLIC_TYPES_FOLDER as t, isNuxtProjectRoot as u, mfWarn as v };
