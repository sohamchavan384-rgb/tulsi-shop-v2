import path from "path";
import fs from "fs";
import { MFModuleType, logger } from "@module-federation/sdk";
import { findPackageJson } from "./findPackageJson.mjs";









class PKGJsonManager {
    setPKGJson(pkg) {
        this._pkg = pkg;
    }
    readPKGJson(root = process.cwd()) {
        if (this._pkg) {
            return this._pkg;
        }
        try {
            // eslint-disable-next-line no-restricted-globals
            const pkg = JSON.parse(fs.readFileSync(path.resolve(root, 'package.json'), 'utf8'));
            this._pkg = pkg;
            return pkg;
        } catch (_err) {
            try {
                const pkgPath = findPackageJson(root);
                if (!pkgPath) {
                    return {};
                }
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                this._pkg = pkg;
                return pkg;
            } catch (err) {
                logger.error(err);
                return {};
            }
        }
    }
    getExposeGarfishModuleType(root = process.cwd()) {
        const pkg = this.readPKGJson(root);
        return pkg?.['mf']?.type === MFModuleType.NPM ? MFModuleType.NPM : MFModuleType.APP;
    }
}

export { PKGJsonManager };
