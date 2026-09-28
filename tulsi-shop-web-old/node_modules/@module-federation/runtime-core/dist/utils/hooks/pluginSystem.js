import { assert } from "../logger.js";
import { isPlainObject } from "../tool.js";
import "../index.js";

//#region src/utils/hooks/pluginSystem.ts
var PluginSystem = class {
	constructor(lifecycle) {
		this.registerPlugins = {};
		this.lifecycle = lifecycle;
		this.lifecycleKeys = Object.keys(lifecycle);
	}
	applyPlugin(plugin) {
		assert(isPlainObject(plugin), "Plugin configuration is invalid.");
		const pluginName = plugin.name;
		assert(pluginName, "A name must be provided by the plugin.");
		if (!this.registerPlugins[pluginName]) {
			this.registerPlugins[pluginName] = plugin;
			this.lifecycleKeys.forEach((key) => {
				const pluginLife = plugin[key];
				if (pluginLife) this.lifecycle[key].on(pluginLife);
			});
		}
	}
	removePlugin(pluginName) {
		assert(pluginName, "A name is required.");
		const plugin = this.registerPlugins[pluginName];
		assert(plugin, `The plugin "${pluginName}" is not registered.`);
		this.lifecycleKeys.forEach((key) => {
			const pluginLife = plugin[key];
			if (pluginLife) this.lifecycle[key].remove(pluginLife);
		});
		delete this.registerPlugins[pluginName];
	}
};

//#endregion
export { PluginSystem };
//# sourceMappingURL=pluginSystem.js.map