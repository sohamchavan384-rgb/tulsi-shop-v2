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
__webpack_require__.r(__webpack_exports__);
class BasicPluginOptionsManager {
    get enable() {
        return Boolean(this._options);
    }
    get options() {
        return this._options;
    }
    get root() {
        return this._root;
    }
    init(options, extraArgs) {
        this._options = options;
    }
    setOptions(options) {
        this._options = options;
    }
    constructor(root = process.cwd()){
        this._root = root;
    }
}

__webpack_require__.d(__webpack_exports__, {
  BasicPluginOptionsManager: () => (BasicPluginOptionsManager)
});

exports.BasicPluginOptionsManager = __webpack_exports__.BasicPluginOptionsManager;
for(var __rspack_i in __webpack_exports__) {
  if(["BasicPluginOptionsManager"].indexOf(__rspack_i) === -1) {
    exports[__rspack_i] = __webpack_exports__[__rspack_i];
  }
}
Object.defineProperty(exports, '__esModule', { value: true });
