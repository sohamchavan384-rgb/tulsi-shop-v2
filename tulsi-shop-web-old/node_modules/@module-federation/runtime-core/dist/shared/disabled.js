import { AsyncWaterfallHook } from "../utils/hooks/asyncWaterfallHooks.js";
import { PluginSystem } from "../utils/hooks/pluginSystem.js";
import "../utils/hooks/index.js";

//#region src/shared/disabled.ts
var DisabledSharedHandler = class {
	constructor() {
		this.shareScopeMap = {};
		this.hooks = new PluginSystem({ afterResolve: new AsyncWaterfallHook("afterResolve") });
	}
	registerShared() {
		return {
			newShareInfos: {},
			allShareInfos: {}
		};
	}
	loadShare() {
		throw new Error("Shared dependency loading is disabled by experiments.optimization.disableShared.");
	}
	loadShareSync() {
		throw new Error("Shared dependency loading is disabled by experiments.optimization.disableShared.");
	}
	initializeSharing() {
		return [];
	}
	initShareScopeMap(scopeName, shareScope) {
		this.shareScopeMap[scopeName] = shareScope;
	}
};

//#endregion
export { DisabledSharedHandler };
//# sourceMappingURL=disabled.js.map