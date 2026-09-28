import { assert, error, logger } from "../utils/logger.js";
import { getFMId } from "../utils/tool.js";
import { CurrentGlobal, Global, getInfoWithoutType, globalLoading } from "../global.js";
import { DEFAULT_REMOTE_TYPE, DEFAULT_SCOPE } from "../constant.js";
import { getGlobalShareScope } from "../utils/share.js";
import { composeRemoteRequestId, matchRemoteWithNameAndExpose } from "../utils/manifest.js";
import { getRemoteEntryUniqueKey, getRemoteInfo } from "../utils/load.js";
import { optionsToMFContext } from "../utils/context.js";
import "../utils/index.js";
import { formatPreloadArgs, preloadAssets } from "../utils/preload.js";
import { Module as Module$1 } from "../module/index.js";
import { SyncHook } from "../utils/hooks/syncHook.js";
import { AsyncHook } from "../utils/hooks/asyncHook.js";
import { SyncWaterfallHook } from "../utils/hooks/syncWaterfallHook.js";
import { AsyncWaterfallHook } from "../utils/hooks/asyncWaterfallHooks.js";
import { PluginSystem } from "../utils/hooks/pluginSystem.js";
import "../utils/hooks/index.js";
import { getGlobalRemoteInfo } from "../plugins/snapshot/SnapshotHandler.js";
import { composeKeyWithSeparator, isBrowserEnvValue, warn } from "@module-federation/sdk";
import { RUNTIME_004, runtimeDescMap } from "@module-federation/error-codes";

//#region src/remote/index.ts
var RemoteHandler = class {
	constructor(host) {
		this.hooks = new PluginSystem({
			beforeRegisterRemote: new SyncWaterfallHook("beforeRegisterRemote"),
			registerRemote: new SyncWaterfallHook("registerRemote"),
			beforeRequest: new AsyncWaterfallHook("beforeRequest"),
			afterMatchRemote: new AsyncHook("afterMatchRemote"),
			onLoad: new AsyncHook("onLoad"),
			afterLoadRemote: new AsyncHook("afterLoadRemote"),
			handlePreloadModule: new SyncHook("handlePreloadModule"),
			errorLoadRemote: new AsyncHook("errorLoadRemote"),
			beforePreloadRemote: new AsyncHook("beforePreloadRemote"),
			generatePreloadAssets: new AsyncHook("generatePreloadAssets"),
			afterPreloadRemote: new AsyncHook("afterPreloadRemote"),
			loadEntry: new AsyncHook()
		});
		this.host = host;
		this.idToRemoteMap = {};
	}
	formatAndRegisterRemote(globalOptions, userOptions) {
		return (userOptions.remotes || []).reduce((res, remote) => {
			this.registerRemote(remote, res, { force: false });
			return res;
		}, globalOptions.remotes);
	}
	setIdToRemoteMap(id, remoteMatchInfo) {
		const { remote, expose } = remoteMatchInfo;
		const { name, alias } = remote;
		this.idToRemoteMap[id] = {
			name: remote.name,
			expose
		};
		if (alias && id.startsWith(name)) {
			const idWithAlias = id.replace(name, alias);
			this.idToRemoteMap[idWithAlias] = {
				name: remote.name,
				expose
			};
			return;
		}
		if (alias && id.startsWith(alias)) {
			const idWithName = id.replace(alias, name);
			this.idToRemoteMap[idWithName] = {
				name: remote.name,
				expose
			};
		}
	}
	async loadRemote(id, options) {
		const { host } = this;
		const startMatchInfo = matchRemoteWithNameAndExpose(host.options.remotes, id);
		let completeRequestId = id;
		let completeExpose = startMatchInfo?.expose;
		let completeRemote = startMatchInfo ? getRemoteInfo(startMatchInfo.remote) : void 0;
		let afterLoadRemoteArgs;
		try {
			const { loadFactory = true } = options || { loadFactory: true };
			const { module, moduleOptions, remoteMatchInfo } = await this.getRemoteModuleAndOptions({ id });
			const { pkgNameOrAlias, remote, expose, id: idRes, remoteSnapshot } = remoteMatchInfo;
			completeRequestId = idRes;
			completeExpose = expose;
			completeRemote = getRemoteInfo(remote);
			const moduleOrFactory = await module.get(idRes, expose, options, remoteSnapshot);
			const moduleWrapper = await this.hooks.lifecycle.onLoad.emit({
				id: idRes,
				pkgNameOrAlias,
				expose,
				exposeModule: loadFactory ? moduleOrFactory : void 0,
				exposeModuleFactory: loadFactory ? void 0 : moduleOrFactory,
				remote,
				options: moduleOptions,
				moduleInstance: module,
				origin: host
			});
			this.setIdToRemoteMap(id, remoteMatchInfo);
			afterLoadRemoteArgs = {
				id: completeRequestId,
				expose: completeExpose,
				remote: completeRemote,
				options,
				origin: host
			};
			if (typeof moduleWrapper === "function") return moduleWrapper;
			return moduleOrFactory;
		} catch (error) {
			const { from = "runtime" } = options || { from: "runtime" };
			let failOver;
			try {
				failOver = await this.hooks.lifecycle.errorLoadRemote.emit({
					id,
					error,
					from,
					lifecycle: "onLoad",
					expose: completeExpose,
					remote: completeRemote,
					origin: host
				});
			} catch (hookError) {
				afterLoadRemoteArgs = {
					id: completeRequestId,
					expose: completeExpose,
					remote: completeRemote,
					options,
					error: hookError,
					origin: host
				};
				throw hookError;
			}
			if (!failOver) {
				afterLoadRemoteArgs = {
					id: completeRequestId,
					expose: completeExpose,
					remote: completeRemote,
					options,
					error,
					origin: host
				};
				throw error;
			}
			afterLoadRemoteArgs = {
				id: completeRequestId,
				expose: completeExpose,
				remote: completeRemote,
				options,
				error,
				origin: host,
				recovered: true
			};
			return failOver;
		} finally {
			if (afterLoadRemoteArgs) await this.hooks.lifecycle.afterLoadRemote.emit(afterLoadRemoteArgs);
		}
	}
	async preloadRemote(preloadOptions) {
		const { host } = this;
		const preloadResults = [];
		await this.hooks.lifecycle.beforePreloadRemote.emit({
			preloadOps: preloadOptions,
			options: host.options,
			origin: host
		});
		const preloadOps = formatPreloadArgs(host.options.remotes, preloadOptions);
		const createPreloadAssetOps = (ops) => {
			const { preloadConfig, remote } = ops;
			const exposes = preloadConfig.exposes || [];
			if (!exposes.length) return [{
				ops,
				id: `${remote.name}/*`
			}];
			return exposes.map((expose) => ({
				ops: {
					...ops,
					preloadConfig: {
						...preloadConfig,
						exposes: [expose]
					}
				},
				id: composeRemoteRequestId(remote.name, expose)
			}));
		};
		let preloadError;
		await Promise.all(preloadOps.flatMap(createPreloadAssetOps).map(async (assetOps) => {
			const { ops, id: preloadId } = assetOps;
			const { remote, preloadConfig } = ops;
			const remoteInfo = getRemoteInfo(remote);
			try {
				const { globalSnapshot, remoteSnapshot } = await host.snapshotHandler.loadRemoteSnapshotInfo({
					moduleInfo: remote,
					id: preloadId,
					initiator: "preloadRemote"
				});
				const assets = await this.hooks.lifecycle.generatePreloadAssets.emit({
					origin: host,
					preloadOptions: ops,
					remote,
					remoteInfo,
					globalSnapshot,
					remoteSnapshot
				});
				if (!assets) return;
				const results = await preloadAssets(remoteInfo, host, assets, true, {
					initiator: "preloadRemote",
					id: preloadId
				}, preloadConfig.recordPreloadedAssets);
				preloadResults.push({
					remote,
					remoteInfo,
					preloadConfig,
					id: preloadId,
					results
				});
			} catch (error) {
				preloadResults.push({
					remote,
					remoteInfo,
					preloadConfig,
					id: preloadId,
					results: [{
						url: remoteInfo.entry,
						status: "error",
						resourceType: /\.json(?:$|[?#])/i.test(remoteInfo.entry) ? "manifest" : "remoteEntry",
						initiator: "preloadRemote",
						id: preloadId,
						error
					}]
				});
			}
		}));
		const failedResults = preloadResults.flatMap((preloadResult) => preloadResult.results.filter((result) => result.status === "error" || result.status === "timeout"));
		if (failedResults.length > 0) {
			preloadError = /* @__PURE__ */ new Error(`preloadRemote failed to load ${failedResults.length} resource(s).`);
			Object.assign(preloadError, {
				results: preloadResults,
				failedResults
			});
		}
		await this.hooks.lifecycle.afterPreloadRemote.emit({
			preloadOps: preloadOptions,
			options: host.options,
			origin: host,
			results: preloadResults,
			error: preloadError
		});
		if (preloadError) throw preloadError;
	}
	registerRemotes(remotes, options) {
		const { host } = this;
		remotes.forEach((remote) => {
			this.registerRemote(remote, host.options.remotes, { force: options?.force });
		});
	}
	initRawContainer(name, url, container) {
		const { host } = this;
		const module = new Module$1({
			host,
			remoteInfo: getRemoteInfo({
				name,
				entry: url
			})
		});
		module.remoteEntryExports = container;
		host.moduleCache.set(name, module);
		return module;
	}
	async getRemoteModuleAndOptions(options) {
		const { host } = this;
		const { id } = options;
		let loadRemoteArgs;
		try {
			loadRemoteArgs = await this.hooks.lifecycle.beforeRequest.emit({
				id,
				options: host.options,
				origin: host
			});
		} catch (error) {
			loadRemoteArgs = await this.hooks.lifecycle.errorLoadRemote.emit({
				id,
				options: host.options,
				origin: host,
				from: "runtime",
				error,
				lifecycle: "beforeRequest"
			});
			if (!loadRemoteArgs) throw error;
		}
		const { id: idRes } = loadRemoteArgs;
		const remoteSplitInfo = matchRemoteWithNameAndExpose(host.options.remotes, idRes);
		if (!remoteSplitInfo) try {
			error(RUNTIME_004, runtimeDescMap, {
				hostName: host.options.name,
				requestId: idRes
			}, void 0, optionsToMFContext(host.options));
		} catch (matchError) {
			await this.hooks.lifecycle.afterMatchRemote.emit({
				id: idRes,
				options: host.options,
				error: matchError,
				origin: host
			});
			throw matchError;
		}
		const { remote: rawRemote } = remoteSplitInfo;
		const remoteInfo = getRemoteInfo(rawRemote);
		await this.hooks.lifecycle.afterMatchRemote.emit({
			id: idRes,
			...remoteSplitInfo,
			options: host.options,
			remoteInfo,
			origin: host
		});
		const matchInfo = await host.sharedHandler.hooks.lifecycle.afterResolve.emit({
			id: idRes,
			...remoteSplitInfo,
			options: host.options,
			origin: host,
			remoteInfo
		});
		const { remote, expose } = matchInfo;
		assert(remote && expose, `The 'beforeRequest' hook was executed, but it failed to return the correct 'remote' and 'expose' values while loading ${idRes}.`);
		let module = host.moduleCache.get(remote.name);
		const moduleOptions = {
			host,
			remoteInfo
		};
		if (!module) {
			module = new Module$1(moduleOptions);
			host.moduleCache.set(remote.name, module);
		}
		return {
			module,
			moduleOptions,
			remoteMatchInfo: matchInfo
		};
	}
	registerRemote(remote, targetRemotes, options) {
		const { host } = this;
		const normalizeRemote = () => {
			if (remote.alias) {
				const findEqual = targetRemotes.find((item) => remote.alias && (item.name.startsWith(remote.alias) || item.alias?.startsWith(remote.alias)));
				assert(!findEqual, `The alias ${remote.alias} of remote ${remote.name} is not allowed to be the prefix of ${findEqual && findEqual.name} name or alias`);
			}
			if ("entry" in remote) {
				if (isBrowserEnvValue && typeof window !== "undefined" && !remote.entry.startsWith("http")) remote.entry = new URL(remote.entry, window.location.origin).href;
			}
			if (!remote.shareScope) remote.shareScope = DEFAULT_SCOPE;
			if (!remote.type) remote.type = DEFAULT_REMOTE_TYPE;
		};
		this.hooks.lifecycle.beforeRegisterRemote.emit({
			remote,
			origin: host
		});
		const registeredRemote = targetRemotes.find((item) => item.name === remote.name);
		if (!registeredRemote) {
			normalizeRemote();
			targetRemotes.push(remote);
			this.hooks.lifecycle.registerRemote.emit({
				remote,
				origin: host
			});
		} else {
			const messages = [`The remote "${remote.name}" is already registered.`, "Please note that overriding it may cause unexpected errors."];
			if (options?.force) {
				this.removeRemote(registeredRemote);
				normalizeRemote();
				targetRemotes.push(remote);
				this.hooks.lifecycle.registerRemote.emit({
					remote,
					origin: host
				});
				warn(messages.join(" "));
			}
		}
	}
	removeRemote(remote) {
		try {
			const { host } = this;
			const { name } = remote;
			const remoteIndex = host.options.remotes.findIndex((item) => item.name === name);
			if (remoteIndex !== -1) host.options.remotes.splice(remoteIndex, 1);
			const globalSnapshotKey = getInfoWithoutType(CurrentGlobal.__FEDERATION__.moduleInfo, getFMId(remote)).key;
			delete CurrentGlobal.__FEDERATION__.moduleInfo[globalSnapshotKey];
			if ("entry" in remote) {
				host.snapshotHandler.manifestCache.delete(remote.entry);
				delete Global.__FEDERATION__.__MANIFEST_LOADING__[remote.entry];
			}
			const { hostGlobalSnapshot } = getGlobalRemoteInfo(remote, host);
			if (hostGlobalSnapshot) {
				const remoteKey = hostGlobalSnapshot && "remotesInfo" in hostGlobalSnapshot && hostGlobalSnapshot.remotesInfo && getInfoWithoutType(hostGlobalSnapshot.remotesInfo, remote.name).key;
				if (remoteKey) delete hostGlobalSnapshot.remotesInfo[remoteKey];
			}
			const loadedModule = host.moduleCache.get(remote.name);
			if (loadedModule) {
				const remoteInfo = loadedModule.remoteInfo;
				const key = remoteInfo.entryGlobalName;
				if (CurrentGlobal[key]) if (Object.getOwnPropertyDescriptor(CurrentGlobal, key)?.configurable) delete CurrentGlobal[key];
				else CurrentGlobal[key] = void 0;
				const remoteEntryUniqueKey = getRemoteEntryUniqueKey(loadedModule.remoteInfo);
				if (globalLoading[remoteEntryUniqueKey]) delete globalLoading[remoteEntryUniqueKey];
				let remoteInsId = remoteInfo.buildVersion ? composeKeyWithSeparator(remoteInfo.name, remoteInfo.buildVersion) : remoteInfo.name;
				const remoteInsIndex = CurrentGlobal.__FEDERATION__.__INSTANCES__.findIndex((ins) => {
					if (remoteInfo.buildVersion) return ins.options.id === remoteInsId;
					else return ins.name === remoteInsId;
				});
				if (remoteInsIndex !== -1) {
					const remoteIns = CurrentGlobal.__FEDERATION__.__INSTANCES__[remoteInsIndex];
					remoteInsId = remoteIns.options.id || remoteInsId;
					const globalShareScopeMap = getGlobalShareScope();
					let isAllSharedNotUsed = true;
					const needDeleteKeys = [];
					Object.keys(globalShareScopeMap).forEach((instId) => {
						const shareScopeMap = globalShareScopeMap[instId];
						shareScopeMap && Object.keys(shareScopeMap).forEach((shareScope) => {
							const shareScopeVal = shareScopeMap[shareScope];
							shareScopeVal && Object.keys(shareScopeVal).forEach((shareName) => {
								const sharedPkgs = shareScopeVal[shareName];
								sharedPkgs && Object.keys(sharedPkgs).forEach((shareVersion) => {
									const shared = sharedPkgs[shareVersion];
									if (shared && typeof shared === "object" && shared.from === remoteInfo.name) if (shared.loaded || shared.loading) {
										shared.useIn = shared.useIn.filter((usedHostName) => usedHostName !== remoteInfo.name);
										if (shared.useIn.length) isAllSharedNotUsed = false;
										else needDeleteKeys.push([
											instId,
											shareScope,
											shareName,
											shareVersion
										]);
									} else needDeleteKeys.push([
										instId,
										shareScope,
										shareName,
										shareVersion
									]);
								});
							});
						});
					});
					if (isAllSharedNotUsed) {
						remoteIns.shareScopeMap = {};
						delete globalShareScopeMap[remoteInsId];
					}
					needDeleteKeys.forEach(([insId, shareScope, shareName, shareVersion]) => {
						delete globalShareScopeMap[insId]?.[shareScope]?.[shareName]?.[shareVersion];
					});
					CurrentGlobal.__FEDERATION__.__INSTANCES__.splice(remoteInsIndex, 1);
				}
				host.moduleCache.delete(remote.name);
			}
		} catch (err) {
			logger.error(`removeRemote failed: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
};

//#endregion
export { RemoteHandler };
//# sourceMappingURL=index.js.map