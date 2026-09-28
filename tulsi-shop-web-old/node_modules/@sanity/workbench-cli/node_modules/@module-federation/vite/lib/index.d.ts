import { moduleFederationPlugin } from "@module-federation/sdk";
import { ShareStrategy } from "@module-federation/runtime/types";
//#region src/utils/normalizeModuleFederationOptions.d.ts
interface RemoteObjectConfig {
  type?: string;
  name: string;
  internalName?: string;
  entry: string;
  entryGlobalName?: string;
  shareScope?: string | string[];
}
interface TreeShakingConfig {
  mode: 'server-calc' | 'runtime-infer';
  usedExports?: string[];
}
interface PluginManifestOptions {
  filePath?: string;
  disableAssetsAnalyze?: boolean;
  fileName?: string;
  additionalData?: (options: {
    stats: Record<string, unknown>;
    manifest?: Record<string, unknown>;
    pluginOptions: Record<string, unknown>;
    compiler?: unknown;
    compilation?: unknown;
    bundler: 'vite';
  }) => Promise<Record<string, unknown> | void> | Record<string, unknown> | void;
}
type ModuleFederationOptions = {
  exposes?: Record<string, string | {
    import: string;
  }> | undefined;
  filename?: string;
  library?: any;
  name: string;
  remotes?: Record<string, string | RemoteObjectConfig> | undefined;
  runtime?: any;
  shareScope?: string | string[];
  /**
   * Override the public path used for remote entries
   * Defaults to Vite's base config or "auto" if base is empty
   */
  publicPath?: string;
  /**
   * Controls whether all CSS assets from the bundle should be added to every exposed module.
   * When false (default), the plugin will not process any CSS assets.
   * When true, all CSS assets are bundled into every exposed module.
   */
  bundleAllCSS?: boolean;
  /** Directory reserved for deploy-service generated secondary shared artifacts. */
  treeShakingDir?: string;
  /** Whether inferred usedExports metadata is injected into generated runtime records. */
  injectTreeShakingUsedExports?: boolean;
  treeShakingSharedPlugins?: string[];
  treeShakingSharedExcludePlugins?: string[];
  shared?: string[] | Record<string, string | {
    name?: string;
    version?: string;
    shareScope?: string;
    singleton?: boolean;
    eager?: boolean;
    requiredVersion?: moduleFederationPlugin.SharedConfig['requiredVersion'];
    strictVersion?: boolean;
    /** Suppress the missing local dependency warning for `import: false` shares. */
    suppressMissingImportWarning?: boolean;
    treeShaking?: TreeShakingConfig;
    import?: moduleFederationPlugin.SharedConfig['import'];
  }> | undefined;
  runtimePlugins?: Array<string | [string, Record<string, unknown>]>;
  getPublicPath?: string;
  implementation?: string;
  manifest?: PluginManifestOptions | boolean;
  dev?: boolean | PluginDevOptions;
  dts?: boolean | PluginDtsOptions;
  shareStrategy?: ShareStrategy;
  ignoreOrigin?: boolean;
  virtualModuleDir?: string;
  hostInitInjectLocation?: HostInitInjectLocationOptions;
  /**
   * Timeout for parsing modules in seconds.
   * Defaults to 10 seconds.
   */
  moduleParseTimeout?: number;
  /**
   * Idle timeout for parsing modules in seconds. When set, the timeout resets
   * on every parsed module and only fires when there has been no module activity
   * for the configured duration. Prefer this over `moduleParseTimeout` for large
   * codebases where the total build time may exceed the fixed timeout.
   */
  moduleParseIdleTimeout?: number;
  /**
   * Allows generate additional remoteEntry file for "var" host environment
   */
  varFilename?: string;
  /**
   * Target environment for the build to enable effective tree-shaking.
   *
   * @see https://module-federation.io/configure/experiments#target
   * @default 'web' (or 'node' if build.ssr is enabled)
   */
  target?: 'web' | 'node';
  /**
   * Removes remote-consumption support from the federation runtime.
   * Only enable this for builds that never load remotes.
   *
   * @default false
   */
  disableRemote?: boolean;
  /**
   * Removes shared-dependency support from the federation runtime.
   * Only enable this when the build has no shared dependencies.
   *
   * @default false
   */
  disableShared?: boolean;
  /**
   * Removes snapshot support, including manifest-based remotes, preload,
   * dynamic type hints, HMR, and devtools integration.
   *
   * @default false (true for Node/SSR builds)
   */
  disableSnapshot?: boolean;
  /**
   * Additional packages to mark as external in the SSR remote entry build.
   * Shared packages and MF runtime packages are always external. Use this to
   * add any other Node-only packages that should not be bundled into the SSR entry.
   */
  ssrExternals?: string[];
  /**
   * Experimental Module Federation capabilities.
   *
   * @see https://module-federation.io/configure/experiments
   */
  experiments?: PluginExperimentsOptions;
};
interface PluginExperimentsOptions {
  /**
   * Treat `@module-federation/runtime-core` as an external that reads
   * `globalThis._FEDERATION_RUNTIME_CORE` at runtime. Pair with a host that
   * sets `provideExternalRuntime: true`.
   */
  externalRuntime?: boolean;
  /**
   * Pure-consumer only (no `exposes`). Injects a local runtime plugin that
   * publishes `runtime-core` on `globalThis._FEDERATION_RUNTIME_CORE`.
   */
  provideExternalRuntime?: boolean;
  /** Generate the React SSR/hydration island capability for eligible exposes. */
  ssrMode?: 'ISLAND';
}
type HostInitInjectLocationOptions = 'entry' | 'html';
interface PluginDevOptions {
  disableLiveReload?: boolean;
  disableHotTypesReload?: boolean;
  disableDynamicRemoteTypeHints?: boolean;
  /**
   * Controls cross-federation HMR for remote modules.
   *
   * - `false` / `undefined` — HMR disabled (default).
   * - `true` — HMR enabled with auto-detected strategy. When a framework
   *   plugin with cross-federation HMR support is detected, broadcast/relay
   *   is suppressed and the framework's native HMR handles updates:
   *     - React (`@vitejs/plugin-react` / `@vitejs/plugin-react-swc`) — the
   *       plugin serves a `/@react-refresh` proxy on remotes that delegates
   *       to the host's `RefreshRuntime`, unifying the component registry.
   *     - Vue (`@vitejs/plugin-vue` / `@vitejs/plugin-vue-jsx`) — the plugin
   *       injects a `__VUE_HMR_RUNTIME__` guard into the host page so the
   *       first-loaded (host) Vue runtime is pinned and remote-loaded Vue
   *       copies cannot overwrite it.
   *   For any host, the plugin also injects a script that clears the
   *   federation `moduleCache` on `vite:beforeUpdate` so subsequent
   *   `loadRemote()` calls return the freshly patched module.
   *   Other frameworks fall back to full page reloads.
   * - `'full-reload'` — HMR enabled, always use full page reloads even when
   *   a framework with native cross-federation HMR is detected.
   */
  remoteHmr?: boolean | 'full-reload';
}
interface RemoteTypeUrl {
  alias?: string;
  api: string;
  zip: string;
}
interface RemoteTypeUrls {
  [remoteName: string]: RemoteTypeUrl;
}
interface PluginDtsOptions {
  generateTypes?: boolean | DtsRemoteOptions;
  consumeTypes?: boolean | DtsHostOptions;
  tsConfigPath?: string;
  extraOptions?: Record<string, unknown>;
  implementation?: string;
  cwd?: string;
  displayErrorInTerminal?: boolean;
}
interface DtsRemoteOptions {
  tsConfigPath?: string;
  typesFolder?: string;
  compiledTypesFolder?: string;
  deleteTypesFolder?: boolean;
  additionalFilesToCompile?: string[];
  compilerInstance?: 'tsc' | 'vue-tsc' | 'tspc' | string;
  compileInChildProcess?: boolean;
  generateAPITypes?: boolean;
  extractThirdParty?: boolean | {
    exclude?: Array<string | RegExp>;
  };
  extractRemoteTypes?: boolean;
  abortOnError?: boolean;
  deleteTsConfig?: boolean;
}
interface DtsHostOptions {
  typesFolder?: string;
  abortOnError?: boolean;
  remoteTypesFolder?: string;
  deleteTypesFolder?: boolean;
  maxRetries?: number;
  consumeAPITypes?: boolean;
  runtimePkgs?: string[];
  remoteTypeUrls?: (() => Promise<RemoteTypeUrls>) | RemoteTypeUrls;
  timeout?: number;
  family?: 0 | 4 | 6;
  typesOnBuild?: boolean;
}
//#endregion
//#region src/index.d.ts
declare function federation(mfUserOptions: ModuleFederationOptions): any[];
declare function createModuleFederationConfig<T extends ModuleFederationOptions>(options: T): T;
//#endregion
export { type ModuleFederationOptions, type PluginExperimentsOptions, type PluginManifestOptions, type TreeShakingConfig, createModuleFederationConfig, federation };