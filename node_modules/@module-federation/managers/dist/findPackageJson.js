"use strict";
const __rslib_import_meta_url__ = /*#__PURE__*/ (function () {
  return typeof document === 'undefined'
    ? new (require('url'.replace('', '')).URL)('file:' + __filename).href
    : (document.currentScript && document.currentScript.src) ||
      new URL('main.js', document.baseURI).href;
})();
;
// The require scope
var __webpack_require__ = {};

// webpack/runtime/compat_get_default_export
(() => {
// getDefaultExport function for compatibility with non-ESM modules
__webpack_require__.n = (module) => {
	var getter = module && module.__esModule ?
		() => (module['default']) :
		() => (module);
	__webpack_require__.d(getter, { a: getter });
	return getter;
};

})();
// webpack/runtime/define_property_getters
(() => {
__webpack_require__.d = (exports, getters, values) => {
	var define = (defs, kind) => {
		for(var key in defs) {
			if(__webpack_require__.o(defs, key) && !__webpack_require__.o(exports, key)) {
				Object.defineProperty(exports, key, { enumerable: true, [kind]: defs[key] });
			}
		}
	};
	define(getters, "get");
	define(values, "value");
};
})();
// webpack/runtime/has_own_property
(() => {
__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
})();
// webpack/runtime/make_namespace_object
(() => {
// define __esModule on exports
__webpack_require__.r = (exports) => {
	if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	}
	Object.defineProperty(exports, '__esModule', { value: true });
};
})();
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  findPackageJson: () => (/* binding */ findPackageJson)
});

;// CONCATENATED MODULE: external "node:fs"
const external_node_fs_namespaceObject = require("node:fs");
var external_node_fs_default = /*#__PURE__*/__webpack_require__.n(external_node_fs_namespaceObject);
;// CONCATENATED MODULE: external "node:path"
const external_node_path_namespaceObject = require("node:path");
var external_node_path_default = /*#__PURE__*/__webpack_require__.n(external_node_path_namespaceObject);
;// CONCATENATED MODULE: ./src/findPackageJson.ts


function findPackageJson(startPath) {
    let currentPath = external_node_path_default().resolve(startPath);
    while(true){
        const packageJsonPath = external_node_path_default().join(currentPath, 'package.json');
        if (external_node_fs_default().existsSync(packageJsonPath)) {
            return packageJsonPath;
        }
        const parentPath = external_node_path_default().dirname(currentPath);
        if (parentPath === currentPath) {
            return undefined;
        }
        currentPath = parentPath;
    }
}

exports.findPackageJson = __webpack_exports__.findPackageJson;
for(var __rspack_i in __webpack_exports__) {
  if(["findPackageJson"].indexOf(__rspack_i) === -1) {
    exports[__rspack_i] = __webpack_exports__[__rspack_i];
  }
}
Object.defineProperty(exports, '__esModule', { value: true });
