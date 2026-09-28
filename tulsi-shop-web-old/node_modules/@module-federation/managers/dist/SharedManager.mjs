import path from "path";
import fs from "fs";
import { isRequiredVersion } from "@module-federation/sdk";
import { BasicPluginOptionsManager } from "./BasicPluginOptionsManager.mjs";
import { parseOptions } from "./utils.mjs";
import { findPackageJson } from "./findPackageJson.mjs";













class SharedManager extends BasicPluginOptionsManager {
    get enable() {
        return Boolean(Object.keys(this.sharedPluginOptions.shared).length);
    }
    get sharedPluginOptions() {
        const normalizedShared = this.normalizedOptions;
        const shared = Object.keys(normalizedShared).reduce((sum, cur)=>{
            const { singleton, requiredVersion, version, eager, shareScope, import: sharedImport, treeShaking } = normalizedShared[cur];
            sum[cur] = {
                singleton,
                requiredVersion,
                version,
                eager,
                shareScope,
                import: sharedImport,
                treeShaking
            };
            return sum;
        }, {});
        return {
            shared,
            shareScope: this.options.shareScope || 'default'
        };
    }
    findPkg(name, shareConfig) {
        try {
            let pkgPath = '';
            let depName = name;
            if (shareConfig.import) {
                if (path.isAbsolute(shareConfig.import)) {
                    pkgPath = shareConfig.import;
                } else if (shareConfig.import.startsWith('.')) {
                    pkgPath = path.resolve(this.root, shareConfig.import);
                }
            } else {
                if (shareConfig.packageName) {
                    depName = shareConfig.packageName;
                }
            }
            pkgPath = pkgPath || require.resolve(depName, {
                paths: [
                    this.root
                ]
            });
            const pkgJsonPath = findPackageJson(path.dirname(pkgPath));
            if (!pkgJsonPath) {
                throw new Error(`Unable to find package.json for ${depName}`);
            }
            return {
                pkg: JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')),
                path: '',
                pkgPath: ''
            };
        } catch (err) {
            return {
                pkg: {},
                path: '',
                pkgPath: ''
            };
        }
    }
    get enableTreeShaking() {
        return Object.values(this.normalizedOptions).some((item)=>item.treeShaking);
    }
    transformSharedConfig(sharedConfig) {
        const defaultSharedConfig = {
            singleton: true,
            requiredVersion: undefined,
            shareScope: 'default'
        };
        return {
            ...defaultSharedConfig,
            ...sharedConfig
        };
    }
    normalizeOptions(options) {
        const normalizedShared = {};
        const sharedOptions = parseOptions(options, (item, key)=>{
            if (typeof item !== 'string') throw new Error('Unexpected array in shared');
            const config = item === key || !isRequiredVersion(item) ? {
                import: item
            } : {
                import: key,
                requiredVersion: item
            };
            return config;
        }, (item)=>item);
        sharedOptions.forEach((item)=>{
            const [sharedName, sharedOptions] = item;
            const pkgInfo = this.findPkg(sharedName, sharedOptions);
            const sharedConfig = this.transformSharedConfig(sharedOptions);
            normalizedShared[sharedName] = {
                ...sharedConfig,
                requiredVersion: typeof sharedConfig.requiredVersion !== 'undefined' ? sharedConfig.requiredVersion : `^${pkgInfo.pkg['version']}`,
                name: sharedName,
                version: pkgInfo.pkg['version'],
                eager: Boolean(sharedConfig.eager)
            };
        });
        this.normalizedOptions = normalizedShared;
    }
    init(options) {
        this.setOptions(options);
        this.normalizeOptions(options.shared);
    }
    constructor(...args){
        super(...args), this.normalizedOptions = {};
    }
}


export { SharedManager };
