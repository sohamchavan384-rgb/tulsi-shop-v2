const require_logger = require('./logger.cjs');
const require_tool = require('./tool.cjs');
const require_global = require('../global.cjs');

//#region src/utils/plugin.ts
function getPluginsToRegister(plugins) {
	const pluginsByName = /* @__PURE__ */ new Map();
	[...plugins || [], ...require_global.getGlobalHostPlugins()].forEach((plugin) => {
		if (!plugin) return;
		require_logger.assert(require_tool.isPlainObject(plugin), "Plugin configuration is invalid.");
		require_logger.assert(plugin.name, "A name must be provided by the plugin.");
		if (!pluginsByName.has(plugin.name)) pluginsByName.set(plugin.name, plugin);
	});
	return Array.from(pluginsByName.values());
}
function getInstancePlugin(plugin, instanceHooks) {
	if (instanceHooks === void 0) return plugin;
	return {
		...instanceHooks,
		name: plugin.name,
		version: plugin.version
	};
}
function registerPlugins(plugins, instance) {
	const registeredPlugins = /* @__PURE__ */ new Map();
	instance.options.plugins.forEach((plugin) => {
		if (plugin) registeredPlugins.set(plugin.name, plugin);
	});
	const hookInstances = [
		instance.hooks,
		instance.remoteHandler.hooks,
		instance.sharedHandler.hooks,
		instance.snapshotHandler.hooks,
		instance.loaderHook,
		instance.bridgeHook
	];
	getPluginsToRegister(plugins).forEach((plugin) => {
		registeredPlugins.set(plugin.name, plugin);
		if (instance.hooks.registerPlugins[plugin.name]) return;
		const instancePlugin = getInstancePlugin(plugin, plugin.apply?.(instance));
		hookInstances.forEach((hookInstance) => {
			hookInstance.applyPlugin(instancePlugin);
		});
	});
	return Array.from(registeredPlugins.values());
}

//#endregion
exports.registerPlugins = registerPlugins;
//# sourceMappingURL=plugin.cjs.map