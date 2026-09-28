import { assert } from "./logger.js";
import { isPlainObject } from "./tool.js";
import { getGlobalHostPlugins } from "../global.js";

//#region src/utils/plugin.ts
function getPluginsToRegister(plugins) {
	const pluginsByName = /* @__PURE__ */ new Map();
	[...plugins || [], ...getGlobalHostPlugins()].forEach((plugin) => {
		if (!plugin) return;
		assert(isPlainObject(plugin), "Plugin configuration is invalid.");
		assert(plugin.name, "A name must be provided by the plugin.");
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
export { registerPlugins };
//# sourceMappingURL=plugin.js.map