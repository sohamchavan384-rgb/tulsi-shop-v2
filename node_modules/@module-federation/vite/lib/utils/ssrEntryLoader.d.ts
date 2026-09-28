//#region src/utils/ssrEntryLoader.d.ts
/**
 * MF runtime plugin that intercepts the `loadEntry` lifecycle hook on the
 * server and loads the SSR-compatible remote entry instead of the browser one.
 *
 * This completely replaces the need for any `@module-federation/sdk` patches.
 * The `loadEntry` hook is emitted by `runtime-core` before it falls through to
 * `loadScriptNode` — if the hook returns a value, the runtime uses it directly.
 *
 * Strategy:
 *  - In Node (detected through process.versions.node), fetch the remote's mf-manifest.json
 *    to discover the ssrRemoteEntry URL and its type.
 *  - ESM entry: use a dynamic `import()` — the SSR entry has no browser
 *    globals and all shared packages are external.
 *  - Dev mode (Vite 8+ only): use `ModuleRunner` with an HTTP transport backed
 *    by the remote's `/__mf_runner__` endpoint. This fetches fully-transformed
 *    module source through Vite's plugin pipeline, avoiding serialisation which
 *    cannot faithfully represent React components or closures.
 *
 *    Dev mode on Vite < 8 is NOT supported by this integration because the
 *    cross-process `fetchModule` proxy uses Vite 8's environment APIs.
 *    `ModuleRunner` itself is available in earlier Vite versions, but an older
 *    remote needs a different transport and server endpoint.
 *
 * Exported as a plain factory function so it can be serialised into the
 * generated runtimePlugins list in virtualRemotes.ts.
 */
interface RemoteInfo {
  name: string;
  entry: string;
  type?: string;
  entryGlobalName?: string;
}
declare class SsrEntryHttpError extends Error {
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly bodyPreview: string;
  constructor(url: string, status: number, statusText: string, bodyPreview: string);
}
/**
 * Drop the loader's caches so the next `loadEntry` re-resolves and re-fetches
 * remote SSR entries. Pass a remote entry URL to scope the invalidation to one
 * remote; call with no arguments to invalidate everything.
 *
 * Note: the MF runtime keeps its own container/module caches per federation
 * instance. This function best-effort clears the module caches of all global
 * federation instances so re-renders load fresh remote modules, but hosts that
 * hold direct references to previously loaded modules keep those references.
 */
declare function revalidate(remoteEntryUrl?: string): void;
/**
 * Neutralize browser-only preload machinery in Vite/Rolldown output so the
 * code can evaluate in Node. Shared by the temp-file and vm strategies.
 */
declare function neutralizeBrowserPreloadHelpers(code: string): string;
/**
 * MF runtime plugin factory.
 *
 * Usage in runtimePlugins:
 *   import { ssrEntryLoaderPlugin } from '@module-federation/vite/ssrEntryLoader'
 *   federation({ runtimePlugins: [ssrEntryLoaderPlugin] })
 *
 * The plugin is also injected automatically for SSR contexts by the vite plugin.
 */
interface SsrEntryLoaderOptions {
  /**
   * Pre-resolved absolute file paths for common shared packages, keyed by
   * bare specifier. Populated at build time by the Vite plugin from the MF
   * plugin's own installed location so the resolution is package-manager-
   * agnostic. ssrEntryLoader uses these directly when rewriting bare specifiers
   * in remote SSR entry temp files — no runtime createRequire walk-up needed.
   */
  resolvedShared?: Record<string, string>;
  /**
   * How to evaluate remote SSR entries on the server.
   *
   * - `'temp-file'` (default): fetch the ESM graph, rewrite specifiers, write
   *   temp files and `import()` them. Works on stock Node; shared packages are
   *   pinned to the host's copies via `resolvedShared` (no version negotiation).
   * - `'vm'`: evaluate the graph with `vm.SourceTextModule` and link bare
   *   shared imports through the host's federation share scope (`loadShare`),
   *   restoring version negotiation. Requires `--experimental-vm-modules`;
   *   falls back to `'temp-file'` when unavailable.
   */
  strategy?: 'temp-file' | 'vm';
  /**
   * Share scope consulted by the `'vm'` strategy when linking bare imports.
   * Defaults to `'default'`.
   */
  shareScopeName?: string;
  /**
   * Re-check each remote's manifest when the cached SSR entry resolution is
   * older than this many milliseconds. When the manifest's version changes
   * (remote redeployed at the same URL), the loader drops its caches for that
   * remote so subsequent loads use the new build. Omit to cache until process
   * exit or an explicit `revalidate()` call. Only manifest-resolved entries
   * can be revalidated this way — convention-resolved entries have no version
   * source.
   */
  maxAgeMs?: number;
  /**
   * Maximum time in milliseconds for each SSR network request. Defaults to
   * 10 seconds. Set to `0` to disable the timeout.
   */
  fetchTimeoutMs?: number;
  /**
   * Maximum response body size in bytes for each SSR network request. Defaults
   * to 10 MiB. Set to `0` to disable the limit.
   */
  fetchMaxBytes?: number;
}
declare function ssrEntryLoaderPlugin(options?: SsrEntryLoaderOptions): {
  name: string;
  loadEntry({ remoteInfo, origin }: {
    remoteInfo: RemoteInfo;
    origin?: object;
  }): Promise<{
    init: unknown;
    get: unknown;
  } | undefined>;
};
//#endregion
export { SsrEntryHttpError, ssrEntryLoaderPlugin as default, neutralizeBrowserPreloadHelpers, revalidate };