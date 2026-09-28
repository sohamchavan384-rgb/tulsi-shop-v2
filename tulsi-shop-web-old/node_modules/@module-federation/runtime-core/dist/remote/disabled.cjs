const require_pluginSystem = require('../utils/hooks/pluginSystem.cjs');
require('../utils/hooks/index.cjs');

//#region src/remote/disabled.ts
const REMOTE_DISABLED_MESSAGE = "Remote loading is disabled by experiments.optimization.disableRemote.";
var UnavailableRemoteModule = class {
	constructor() {
		throw new Error(REMOTE_DISABLED_MESSAGE);
	}
};
var DisabledRemoteHandler = class {
	constructor() {
		this.hooks = new require_pluginSystem.PluginSystem({});
	}
	formatAndRegisterRemote() {
		return [];
	}
	loadRemote() {
		throw new Error(REMOTE_DISABLED_MESSAGE);
	}
	preloadRemote() {
		throw new Error(REMOTE_DISABLED_MESSAGE);
	}
	registerRemotes() {
		throw new Error(REMOTE_DISABLED_MESSAGE);
	}
	getRemoteModuleAndOptions() {
		throw new Error(REMOTE_DISABLED_MESSAGE);
	}
	initRawContainer() {
		throw new Error(REMOTE_DISABLED_MESSAGE);
	}
};

//#endregion
exports.DisabledRemoteHandler = DisabledRemoteHandler;
exports.UnavailableRemoteModule = UnavailableRemoteModule;
//# sourceMappingURL=disabled.cjs.map