const require_pluginSystem = require('../../utils/hooks/pluginSystem.cjs');
require('../../utils/hooks/index.cjs');

//#region src/plugins/snapshot/disabled.ts
var DisabledSnapshotHandler = class {
	constructor() {
		this.hooks = new require_pluginSystem.PluginSystem({});
	}
};

//#endregion
exports.DisabledSnapshotHandler = DisabledSnapshotHandler;
//# sourceMappingURL=disabled.cjs.map