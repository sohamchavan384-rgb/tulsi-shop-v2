import { n as normalizePathForImport } from "./buildPaths-BoaQTkxt.js";
import { _ as mfError, g as createModuleFederationError, l as hasPackageDependency, p as resolveImportPath } from "./dtsConstants-BsaLBaaK.js";
import fs from "fs";
import * as path$1 from "node:path";
import os from "os";
import { normalizeOptions } from "@module-federation/sdk";
import { consumeTypesAPI, generateTypesAPI, isTSProject, normalizeConsumeTypesOptions, normalizeDtsOptions, normalizeGenerateTypesOptions } from "@module-federation/dts-plugin";
import { rpc } from "@module-federation/dts-plugin/core";
//#region src/plugins/pluginDts.ts
const DEFAULT_DEV_OPTIONS = {
	disableLiveReload: true,
	disableHotTypesReload: false,
	disableDynamicRemoteTypeHints: false
};
const DYNAMIC_HINTS_PLUGIN = "@module-federation/dts-plugin/dynamic-remote-type-hints-plugin";
const localIpv4 = "127.0.0.1";
const getIpv4Interfaces = () => {
	try {
		const interfaces = os.networkInterfaces();
		const ipv4Interfaces = [];
		Object.values(interfaces).forEach((detail) => {
			detail?.forEach((detail) => {
				const familyV4Value = typeof detail.family === "string" ? "IPv4" : 4;
				if (detail.family === familyV4Value && detail.address !== localIpv4) ipv4Interfaces.push(detail);
			});
		});
		return ipv4Interfaces;
	} catch (_err) {
		return [];
	}
};
const getIPv4 = () => {
	if (process.env["FEDERATION_IPV4"]) return process.env["FEDERATION_IPV4"];
	return (getIpv4Interfaces()[0] || { address: localIpv4 }).address;
};
const DEV_TYPES_FOLDER = ".dev-server";
const UPDATE_DEBOUNCE_MS = 300;
const forkDevWorkerPath = (() => {
	return resolveImportPath("@module-federation/dts-plugin/dist/fork-dev-worker.js");
})();
var DevWorker = class {
	worker = rpc.createRpcWorker(forkDevWorkerPath, {}, void 0, false);
	constructor(options) {
		this.worker.connect(options);
	}
	update() {
		this.worker.process?.send?.({
			type: rpc.RpcGMCallTypes.CALL,
			id: this.worker.id,
			args: [void 0, "update"]
		});
	}
	exit() {
		this.worker.terminate();
	}
};
const normalizeDevOptions = (dev) => {
	if (dev === false) return false;
	if (dev === true || typeof dev === "undefined") return { ...DEFAULT_DEV_OPTIONS };
	return {
		...DEFAULT_DEV_OPTIONS,
		...dev
	};
};
const buildDtsModuleFederationConfig = (options) => {
	const exposes = {};
	Object.entries(options.exposes).forEach(([key, value]) => {
		if (value.import) exposes[key] = value.import;
	});
	const remotes = {};
	Object.entries(options.remotes).forEach(([key, remote]) => {
		if (!remote.entry) return;
		const entryGlobalName = remote.entryGlobalName?.startsWith("http") || remote.entryGlobalName?.includes(".json") ? remote.name || key : remote.entryGlobalName || remote.name || key;
		remotes[key] = `${entryGlobalName}@${remote.entry}`;
	});
	return {
		...options,
		exposes,
		remotes
	};
};
const resolveOutputDir = (config) => {
	const { outDir } = config.build;
	if (path$1.isAbsolute(outDir)) return normalizePathForImport(path$1.relative(config.root, outDir));
	return outDir;
};
const ensureRuntimePlugin = (options, pluginId) => {
	if (!options.runtimePlugins.some((plugin) => {
		if (typeof plugin === "string") return plugin === pluginId;
		return plugin[0] === pluginId;
	})) options.runtimePlugins.push(pluginId);
};
const getExposeImportPaths = (options) => {
	return Object.values(options.exposes).map((value) => {
		return value.import;
	}).filter((value) => Boolean(value));
};
const usesVueSfcExposes = (options) => {
	return getExposeImportPaths(options).some((value) => value.endsWith(".vue"));
};
const resolveDtsPluginOptions = (dts, options, context) => {
	if (dts === false) return false;
	const inferredGenerateTypesDefaults = { generateAPITypes: true };
	if (usesVueSfcExposes(options) && hasPackageDependency("vue-tsc", context)) inferredGenerateTypesDefaults.compilerInstance = "vue-tsc";
	if (dts === true || typeof dts === "undefined") return { generateTypes: inferredGenerateTypesDefaults };
	const generateTypes = dts.generateTypes;
	return {
		...dts,
		generateTypes: generateTypes === false ? false : {
			...inferredGenerateTypesDefaults,
			...generateTypes === true || typeof generateTypes === "undefined" ? {} : generateTypes
		}
	};
};
const getBasePath = (base) => {
	if (base.startsWith("http://") || base.startsWith("https://")) return new URL(base).pathname.replace(/\/$/, "") || "/";
	return base.replace(/\/$/, "") || "/";
};
const joinBaseAndAsset = (base, assetFileName) => {
	const basePath = getBasePath(base);
	return `${basePath === "/" ? "" : basePath}/${assetFileName}`.replace(/\/{2,}/g, "/");
};
const getDevDtsAssetPaths = (options) => {
	const { outputDir, publicTypesFolder, root, base } = options;
	return {
		apiFilePath: path$1.resolve(root, outputDir, `${DEV_TYPES_FOLDER}.d.ts`),
		apiRequestPath: joinBaseAndAsset(base, `${publicTypesFolder}.d.ts`),
		zipFilePath: path$1.resolve(root, outputDir, `${DEV_TYPES_FOLDER}.zip`),
		zipRequestPath: joinBaseAndAsset(base, `${publicTypesFolder}.zip`)
	};
};
const createDevDtsAssetMiddleware = (assetPaths) => {
	return (req, res, next) => {
		const requestPath = req.url?.split("?")[0];
		const isZipRequest = requestPath === assetPaths.zipRequestPath;
		const isApiRequest = requestPath === assetPaths.apiRequestPath;
		if (!isZipRequest && !isApiRequest) {
			next();
			return;
		}
		const filePath = isZipRequest ? assetPaths.zipFilePath : assetPaths.apiFilePath;
		if (!fs.existsSync(filePath)) {
			res.statusCode = 404;
			res.end();
			return;
		}
		res.statusCode = 200;
		res.setHeader("Content-Type", isZipRequest ? "application/x-gzip" : "application/typescript");
		if (req.method === "HEAD") {
			res.end();
			return;
		}
		const stream = fs.createReadStream(filePath);
		stream.on("error", () => {
			if (!res.headersSent) res.statusCode = 500;
			res.end();
		});
		res.on("close", () => {
			stream.destroy();
		});
		stream.pipe(res);
	};
};
const normalizeDevDtsOptions = (dts, context) => {
	return normalizeOptions(isTSProject(dts, context), {
		generateTypes: { compileInChildProcess: true },
		consumeTypes: { consumeAPITypes: true },
		extraOptions: {},
		displayErrorInTerminal: typeof dts === "object" && dts ? dts.displayErrorInTerminal : void 0
	}, "mfOptions.dts")(dts);
};
const logDtsError = (error, dtsOptions) => {
	if (dtsOptions === false) return;
	if (typeof dtsOptions === "object" && dtsOptions && dtsOptions.displayErrorInTerminal === false) return;
	mfError(error);
};
function pluginDts(options) {
	if (options.dts === false) return [];
	const baseDtsModuleFederationConfig = buildDtsModuleFederationConfig(options);
	const getDtsModuleFederationConfig = (context) => ({
		...baseDtsModuleFederationConfig,
		dts: resolveDtsPluginOptions(options.dts, options, context)
	});
	let resolvedConfig;
	let devWorker;
	let normalizedDevOptions;
	let hasGeneratedBundle = false;
	return [{
		name: "module-federation-dts-dev",
		apply: "serve",
		config(config) {
			normalizedDevOptions = normalizeDevOptions(options.dev);
			if (!normalizedDevOptions) return;
			if (normalizedDevOptions.disableDynamicRemoteTypeHints) return;
			ensureRuntimePlugin(options, DYNAMIC_HINTS_PLUGIN);
			const define = config.define ? { ...config.define } : {};
			if (!("FEDERATION_IPV4" in define)) define.FEDERATION_IPV4 = JSON.stringify(getIPv4());
			config.define = define;
		},
		configResolved(config) {
			resolvedConfig = config;
		},
		configureServer(server) {
			if (!normalizedDevOptions || !resolvedConfig) return;
			const devOptions = normalizedDevOptions;
			if (devOptions.disableDynamicRemoteTypeHints && devOptions.disableHotTypesReload && devOptions.disableLiveReload) return;
			if (!options.name) throw createModuleFederationError("name is required if you want to enable dev server!");
			const outputDir = resolveOutputDir(resolvedConfig);
			const dtsModuleFederationConfig = getDtsModuleFederationConfig(resolvedConfig.root);
			const normalizedDtsOptions = normalizeDevDtsOptions(dtsModuleFederationConfig.dts, resolvedConfig.root);
			if (typeof normalizedDtsOptions !== "object") return;
			const normalizedGenerateTypes = normalizeOptions(Boolean(normalizedDtsOptions), { compileInChildProcess: true }, "mfOptions.dts.generateTypes")(normalizedDtsOptions.generateTypes);
			const remote = normalizedGenerateTypes === false ? void 0 : {
				implementation: normalizedDtsOptions.implementation,
				context: resolvedConfig.root,
				outputDir,
				moduleFederationConfig: { ...dtsModuleFederationConfig },
				hostRemoteTypesFolder: normalizedGenerateTypes.typesFolder || "@mf-types",
				...normalizedGenerateTypes,
				typesFolder: DEV_TYPES_FOLDER
			};
			if (remote) server.middlewares.use(createDevDtsAssetMiddleware(getDevDtsAssetPaths({
				outputDir,
				publicTypesFolder: remote.hostRemoteTypesFolder || "@mf-types",
				root: resolvedConfig.root,
				base: resolvedConfig.base
			})));
			if (remote && !remote.tsConfigPath && normalizedDtsOptions.tsConfigPath) remote.tsConfigPath = normalizedDtsOptions.tsConfigPath;
			const normalizedConsumeTypes = normalizeOptions(Boolean(normalizedDtsOptions), { consumeAPITypes: true }, "mfOptions.dts.consumeTypes")(normalizedDtsOptions.consumeTypes);
			const host = normalizedConsumeTypes === false ? void 0 : {
				implementation: normalizedDtsOptions.implementation,
				context: resolvedConfig.root,
				moduleFederationConfig: dtsModuleFederationConfig,
				typesFolder: normalizedConsumeTypes.typesFolder || "@mf-types",
				abortOnError: false,
				...normalizedConsumeTypes
			};
			const extraOptions = normalizedDtsOptions.extraOptions || {};
			if (!remote && !host && devOptions.disableLiveReload) return;
			const startDevWorker = async () => {
				let remoteTypeUrls;
				if (host) remoteTypeUrls = await new Promise((resolve) => {
					consumeTypesAPI({
						host,
						extraOptions,
						displayErrorInTerminal: normalizedDtsOptions.displayErrorInTerminal
					}, resolve);
				});
				devWorker = new DevWorker({
					name: options.name,
					remote,
					host: host ? {
						...host,
						remoteTypeUrls
					} : void 0,
					extraOptions,
					disableLiveReload: devOptions.disableLiveReload,
					disableHotTypesReload: devOptions.disableHotTypesReload
				});
				let updateTimer;
				const update = () => {
					clearTimeout(updateTimer);
					updateTimer = setTimeout(() => devWorker?.update(), UPDATE_DEBOUNCE_MS);
				};
				server.watcher.on("change", update);
				server.watcher.on("add", update);
				server.watcher.on("unlink", update);
				server.httpServer?.once("close", () => {
					clearTimeout(updateTimer);
					devWorker?.exit();
					server.watcher.off("change", update);
					server.watcher.off("add", update);
					server.watcher.off("unlink", update);
				});
			};
			startDevWorker().catch((error) => {
				logDtsError(error, normalizedDtsOptions);
			});
		}
	}, {
		name: "module-federation-dts-build",
		apply: "build",
		configResolved(config) {
			resolvedConfig = config;
		},
		async generateBundle() {
			if (hasGeneratedBundle) return;
			hasGeneratedBundle = true;
			if (!resolvedConfig) return;
			let normalizedDtsOptions;
			try {
				normalizedDtsOptions = normalizeDtsOptions(getDtsModuleFederationConfig(resolvedConfig.root), resolvedConfig.root);
			} catch (error) {
				logDtsError(error, options.dts);
				return;
			}
			if (typeof normalizedDtsOptions !== "object") return;
			const context = resolvedConfig.root;
			const outputDir = resolveOutputDir(resolvedConfig);
			let consumeOptions;
			try {
				consumeOptions = normalizeConsumeTypesOptions({
					context,
					dtsOptions: normalizedDtsOptions,
					pluginOptions: getDtsModuleFederationConfig(resolvedConfig.root)
				});
			} catch (error) {
				logDtsError(error, normalizedDtsOptions);
				return;
			}
			if (consumeOptions?.host?.typesOnBuild) try {
				await consumeTypesAPI(consumeOptions);
			} catch (error) {
				logDtsError(error, normalizedDtsOptions);
			}
			let generateOptions;
			try {
				generateOptions = normalizeGenerateTypesOptions({
					context,
					outputDir,
					dtsOptions: normalizedDtsOptions,
					pluginOptions: getDtsModuleFederationConfig(resolvedConfig.root)
				});
			} catch (error) {
				logDtsError(error, normalizedDtsOptions);
				return;
			}
			if (!generateOptions) return;
			try {
				await generateTypesAPI({ dtsManagerOptions: generateOptions });
			} catch (error) {
				logDtsError(error, normalizedDtsOptions);
			}
		}
	}];
}
//#endregion
export { pluginDts as default };
