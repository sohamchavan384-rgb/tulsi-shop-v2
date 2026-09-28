const require_logger = require('../logger.cjs');
const require_tool = require('../tool.cjs');
require('../index.cjs');

//#region src/utils/hooks/pluginSystem.ts
var PluginSystem = class {
	constructor(lifecycle) {
		this.registerPlugins = {};
		this.lifecycle = lifecycle;
		this.lifecycleKeys = Object.keys(lifecycle);
	}
	applyPlugin(plugin) {
		require_logger.assert(require_tool.isPlainObject(plugin), "Plugin configuration is invalid.");
		const pluginName = plugin.name;
		require_logger.assert(pluginName, "A name must be provided by the plugin.");
		if (!this.registerPlugins[pluginName]) {
			this.registerPlugins[pluginName] = plugin;
			this.lifecycleKeys.forEach((key) => {
				const pluginLife = plugin[key];
				if (pluginLife) this.lifecycle[key].on(pluginLife);
			});
		}
	}
	removePlugin(pluginName) {
		require_logger.assert(pluginName, "A name is required.");
		const plugin = this.registerPlugins[pluginName];
		require_logger.assert(plugin, `The plugin "${pluginName}" is not registered.`);
		this.lifecycleKeys.forEach((key) => {
			const pluginLife = plugin[key];
			if (pluginLife) this.lifecycle[key].remove(pluginLife);
		});
		delete this.registerPlugins[pluginName];
	}
};

//#endregion
exports.PluginSystem = PluginSystem;
//# sourceMappingURL=pluginSystem.cjs.map