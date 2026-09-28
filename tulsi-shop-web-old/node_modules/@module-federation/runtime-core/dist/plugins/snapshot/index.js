import { error } from "../../utils/logger.js";
import { getRemoteEntryInfoFromSnapshot, isPureRemoteEntry, isRemoteInfoWithEntry } from "../../utils/tool.js";
import { composeRemoteRequestId } from "../../utils/manifest.js";
import "../../utils/index.js";
import { preloadAssets } from "../../utils/preload.js";
import { getResourceUrl, isBrowserEnvValue } from "@module-federation/sdk";
import { RUNTIME_011, runtimeDescMap } from "@module-federation/error-codes";

//#region src/plugins/snapshot/index.ts
function assignRemoteInfo(remoteInfo, remoteSnapshot) {
	const remoteEntryInfo = getRemoteEntryInfoFromSnapshot(remoteSnapshot);
	if (!remoteEntryInfo.url) error(RUNTIME_011, runtimeDescMap, { remoteName: remoteInfo.name });
	let entryUrl = getResourceUrl(remoteSnapshot, remoteEntryInfo.url);
	if (!isBrowserEnvValue && !entryUrl.startsWith("http")) entryUrl = `https:${entryUrl}`;
	remoteInfo.type = remoteEntryInfo.type;
	remoteInfo.entryGlobalName = remoteEntryInfo.globalName;
	remoteInfo.entry = entryUrl;
	remoteInfo.version = remoteSnapshot.version;
	remoteInfo.buildVersion = remoteSnapshot.buildVersion;
}
function snapshotPlugin() {
	return {
		name: "snapshot-plugin",
		async afterResolve(args) {
			const { remote, pkgNameOrAlias, expose, origin, remoteInfo, id } = args;
			if (!isRemoteInfoWithEntry(remote) || !isPureRemoteEntry(remote)) {
				const { remoteSnapshot, globalSnapshot } = await origin.snapshotHandler.loadRemoteSnapshotInfo({
					moduleInfo: remote,
					id: composeRemoteRequestId(remote.name, expose)
				});
				assignRemoteInfo(remoteInfo, remoteSnapshot);
				const preloadOps = [{
					nameOrAlias: pkgNameOrAlias,
					exposes: [expose],
					resourceCategory: "sync",
					share: false,
					depsRemote: false,
					recordPreloadedAssets: true
				}];
				await origin.remoteHandler.hooks.lifecycle.beforePreloadRemote.emit({
					preloadOps,
					options: origin.options,
					origin
				});
				const [preloadConfig] = preloadOps;
				if (preloadConfig) {
					const preloadOptions = {
						remote,
						preloadConfig
					};
					const assets = await origin.remoteHandler.hooks.lifecycle.generatePreloadAssets.emit({
						origin,
						preloadOptions,
						remoteInfo,
						remote,
						remoteSnapshot,
						globalSnapshot
					});
					if (assets) preloadAssets(remoteInfo, origin, assets, false, {
						initiator: "loadRemote",
						id
					}, preloadConfig.recordPreloadedAssets).catch(() => void 0);
				}
				return {
					...args,
					remoteSnapshot
				};
			}
			return args;
		}
	};
}

//#endregion
export { assignRemoteInfo, snapshotPlugin };
//# sourceMappingURL=index.js.map