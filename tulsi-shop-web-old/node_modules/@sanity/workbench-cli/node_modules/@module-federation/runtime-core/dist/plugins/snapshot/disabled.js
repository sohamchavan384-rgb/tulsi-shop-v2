import { PluginSystem } from "../../utils/hooks/pluginSystem.js";
import "../../utils/hooks/index.js";

//#region src/plugins/snapshot/disabled.ts
var DisabledSnapshotHandler = class {
	constructor() {
		this.hooks = new PluginSystem({});
	}
};

//#endregion
export { DisabledSnapshotHandler };
//# sourceMappingURL=disabled.js.map