import { PKGJsonManager } from "./PKGJsonManager.mjs";
import { LOCAL_BUILD_VERSION } from "./constant.mjs";





function processFn(options, normalizeSimple, normalizeOptions, fn) {
    const object = (obj)=>{
        for (const [key, value] of Object.entries(obj)){
            if (typeof value === 'string') {
                fn(key, normalizeSimple(value, key));
            } else {
                fn(key, normalizeOptions(value, key));
            }
        }
    };
    const array = (items)=>{
        for (const item of items){
            if (typeof item === 'string') {
                fn(item, normalizeSimple(item, item));
            } else if (item && typeof item === 'object') {
                object(item);
            } else {
                throw new Error('Unexpected options format');
            }
        }
    };
    if (!options) {
        return;
    } else if (Array.isArray(options)) {
        array(options);
    } else if (typeof options === 'object') {
        object(options);
    } else {
        throw new Error('Unexpected options format');
    }
}
function parseOptions(options, normalizeSimple, normalizeOptions) {
    const items = [];
    processFn(options, normalizeSimple, normalizeOptions, (key, value)=>{
        items.push([
            key,
            value
        ]);
    });
    return items;
}
function getBuildVersion(root) {
    if (process.env['MF_BUILD_VERSION']) {
        return process.env['MF_BUILD_VERSION'];
    }
    const pkg = new PKGJsonManager().readPKGJson(root);
    if (pkg?.['version'] && typeof pkg['version'] === 'string') {
        return pkg['version'];
    }
    return LOCAL_BUILD_VERSION;
}
function getBuildName() {
    return process.env['MF_BUILD_NAME'];
}

export { getBuildName, getBuildVersion, parseOptions };
