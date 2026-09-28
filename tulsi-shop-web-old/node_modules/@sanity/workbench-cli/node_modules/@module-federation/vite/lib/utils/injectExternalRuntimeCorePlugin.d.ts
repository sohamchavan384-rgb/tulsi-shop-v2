//#region src/utils/injectExternalRuntimeCorePlugin.d.ts
/**
 * MF runtime plugin that publishes `@module-federation/runtime-core` on
 * `globalThis._FEDERATION_RUNTIME_CORE` so remotes with `experiments.externalRuntime`
 * can share the host's runtime-core instead of bundling their own copy.
 *
 * Mirrors `@module-federation/inject-external-runtime-core-plugin` without
 * adding that package (or `runtime-tools`) as a dependency of this plugin.
 */
type BeforeInitArgs = {
  options: {
    name: string;
  };
};
declare function injectExternalRuntimeCorePlugin(): {
  name: string;
  version: string;
  beforeInit(args: BeforeInitArgs): BeforeInitArgs;
};
//#endregion
export { injectExternalRuntimeCorePlugin as default };