import { a as DTSManagerOptions } from "./DtsWorker-SBLpkK-D.js";
import { d as isTSProject } from "./constant-C0QI9ddQ.js";
import { moduleFederationPlugin } from "@module-federation/sdk";

//#region src/plugins/DtsPlugin.d.ts
declare const normalizeDtsOptions: (options: moduleFederationPlugin.ModuleFederationPluginOptions, context: string, defaultOptions?: {
  defaultGenerateOptions?: moduleFederationPlugin.DtsRemoteOptions;
  defaultConsumeOptions?: moduleFederationPlugin.DtsHostOptions;
}) => any;
declare class DtsPlugin implements WebpackPluginInstance {
  options: moduleFederationPlugin.ModuleFederationPluginOptions;
  clonedOptions: moduleFederationPlugin.ModuleFederationPluginOptions;
  constructor(options: moduleFederationPlugin.ModuleFederationPluginOptions);
  apply(compiler: Compiler): void;
  addRuntimePlugins(): void;
}
//#endregion
//#region src/plugins/ConsumeTypesPlugin.d.ts
declare const normalizeConsumeTypesOptions: ({
  context,
  dtsOptions,
  pluginOptions
}: {
  context?: string;
  dtsOptions: moduleFederationPlugin.PluginDtsOptions;
  pluginOptions: moduleFederationPlugin.ModuleFederationPluginOptions;
}) => {
  host: any;
  extraOptions: any;
  displayErrorInTerminal: any;
} | undefined;
declare const consumeTypesAPI: (dtsManagerOptions: DTSManagerOptions, cb?: (options: moduleFederationPlugin.RemoteTypeUrls) => void) => Promise<any>;
//#endregion
//#region src/plugins/GenerateTypesPlugin.d.ts
declare const normalizeGenerateTypesOptions: ({
  context,
  outputDir,
  dtsOptions,
  pluginOptions
}: {
  context?: string;
  outputDir?: string;
  dtsOptions: moduleFederationPlugin.PluginDtsOptions;
  pluginOptions: moduleFederationPlugin.ModuleFederationPluginOptions;
}) => DTSManagerOptions | undefined;
declare const generateTypesAPI: ({
  dtsManagerOptions
}: {
  dtsManagerOptions: DTSManagerOptions;
}) => Promise<void>;
//#endregion
export { DtsPlugin, consumeTypesAPI, generateTypesAPI, isTSProject, normalizeConsumeTypesOptions, normalizeDtsOptions, normalizeGenerateTypesOptions };