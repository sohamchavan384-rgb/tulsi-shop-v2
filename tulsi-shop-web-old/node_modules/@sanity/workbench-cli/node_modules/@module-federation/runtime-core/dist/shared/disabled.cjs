const require_asyncWaterfallHooks = require('../utils/hooks/asyncWaterfallHooks.cjs');
const require_pluginSystem = require('../utils/hooks/pluginSystem.cjs');
require('../utils/hooks/index.cjs');

//#region src/shared/disabled.ts
var DisabledSharedHandler = class {
	constructor() {
		this.shareScopeMap = {};
		this.hooks = new require_pluginSystem.PluginSystem({ afterResolve: new require_asyncWaterfallHooks.AsyncWaterfallHook("afterResolve") });
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
exports.DisabledSharedHandler = DisabledSharedHandler;
//# sourceMappingURL=disabled.cjs.map