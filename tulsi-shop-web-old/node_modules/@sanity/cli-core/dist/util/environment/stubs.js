import { JSDOM } from 'jsdom';
const html = `<!doctype html>
<html>
  <head><meta charset="utf-8"></head>
  <body></body>
</html>`;
function isAbortSignalLike(value) {
    return !!value && typeof value === 'object' && 'aborted' in value && typeof value.aborted === 'boolean' && 'addEventListener' in value && typeof value.addEventListener === 'function' && 'removeEventListener' in value && typeof value.removeEventListener === 'function';
}
/**
 * Make JSDOM's `addEventListener({signal})` accept native Node.js AbortSignals.
 *
 * JSDOM validates `signal` using its own realm's `AbortSignal` constructor, which rejects
 * Node's native signal. Instead of replacing the global Abort APIs, intercept those calls
 * and emulate the abortable-listener behavior for cross-realm signals.
 */ function patchEventTargetSignalSupport(dom) {
    const eventTarget = dom.window.EventTarget;
    const addEventListener = eventTarget.prototype.addEventListener;
    eventTarget.prototype.addEventListener = function addEventListenerPatched(type, listener, options) {
        if (typeof options === 'boolean' || !options?.signal) {
            return addEventListener.call(this, type, listener, options);
        }
        const rawSignal = options.signal;
        const isJSDOMSignal = rawSignal instanceof dom.window.AbortSignal;
        if (!rawSignal || isJSDOMSignal || !isAbortSignalLike(rawSignal)) {
            return addEventListener.call(this, type, listener, options);
        }
        const signal = rawSignal;
        if (signal.aborted) {
            return;
        }
        const { signal: _signal, ...optionsWithoutSignal } = options;
        addEventListener.call(this, type, listener, optionsWithoutSignal);
        const removeOnAbort = ()=>{
            this.removeEventListener(type, listener, options);
        };
        signal.addEventListener('abort', removeOnAbort, {
            once: true
        });
    };
}
/**
 * Creates a JSDOM instance and applies polyfills for missing browser globals.
 */ function createBrowserDom() {
    const dom = new JSDOM(html, {
        pretendToBeVisual: true,
        url: 'http://localhost:3333/'
    });
    patchEventTargetSignalSupport(dom);
    // Special handling of certain globals
    if (typeof dom.window.document.execCommand !== 'function') {
        // Crashes ace editor without this :/
        dom.window.document.execCommand = function execCommand(// Provide the right arity for the function, even if unused
        _commandName, _showDefaultUI, _valueArgument) {
            // Return false to indicate "unsupported"
            return false;
        };
    }
    if (dom.window.requestIdleCallback === undefined) {
        dom.window.requestIdleCallback = (cb)=>setTimeout(cb, 10);
    }
    if (dom.window.cancelIdleCallback === undefined) {
        dom.window.cancelIdleCallback = (id)=>clearTimeout(id);
    }
    if (dom.window.ResizeObserver === undefined) {
        dom.window.ResizeObserver = class ResizeObserver {
            // eslint-disable-next-line @typescript-eslint/no-useless-constructor
            constructor(_callback){}
            disconnect() {}
            observe(_target, _options) {}
            unobserve(_target) {}
        };
    }
    if (dom.window.IntersectionObserver === undefined) {
        dom.window.IntersectionObserver = class IntersectionObserver {
            options;
            constructor(_callback, options){
                this.options = options || {};
            }
            get root() {
                return this.options.root || null;
            }
            get rootMargin() {
                return this.options.rootMargin || '';
            }
            get thresholds() {
                return Array.isArray(this.options.threshold) ? this.options.threshold : [
                    this.options.threshold || 0
                ];
            }
            disconnect() {}
            observe(_el) {}
            takeRecords() {
                return [];
            }
            unobserve(_el) {}
        };
    }
    if (dom.window.matchMedia === undefined) {
        dom.window.matchMedia = (_qs)=>({
                matches: false,
                media: '',
                onchange: null
            });
    }
    return dom;
}
/**
 * Web globals that Node.js may provide but whose JSDOM implementations we
 * always prefer, so that behavior is consistent across Node versions.
 *
 * Node 26+ exposes `localStorage`/`sessionStorage`/`Storage` as built-in globals,
 * but `localStorage` is `undefined` unless started with `--localstorage-file`, and
 * the `Storage` constructor identity differs from JSDOM's. Mixing realms would
 * break code that does `localStorage instanceof Storage`, so we override all
 * three together.
 */ const ALWAYS_INCLUDE_FROM_JSDOM = new Set([
    'localStorage',
    'sessionStorage',
    'Storage'
]);
/**
 * Collects all browser globals from the JSDOM window that should be injected
 * into the Node.js global scope to emulate a browser environment.
 *
 * This dynamically iterates over all own properties of the JSDOM window,
 * skipping internal JSDOM properties (prefixed with `_`) and properties that
 * already exist in Node.js globals to avoid conflicts.
 *
 * This approach ensures that any new properties added by JSDOM upgrades are
 * automatically included, preventing "missing global" bugs (e.g. `Element`,
 * `HTMLElement`, `SVGElement` needed by libraries like styled-components).
 */ function collectBrowserStubs() {
    const dom = createBrowserDom();
    const stubs = Object.create(null);
    const nodeGlobals = new Set(Object.getOwnPropertyNames(globalThis));
    for (const key of Object.getOwnPropertyNames(dom.window)){
        // Skip internal JSDOM properties
        if (key.startsWith('_')) continue;
        // Skip numeric indices (e.g. '0' for window[0])
        if (/^\d+$/.test(key)) continue;
        // Skip properties that Node.js already provides to avoid conflicts, unless
        // we explicitly want to override Node's version with JSDOM's
        if (nodeGlobals.has(key) && !ALWAYS_INCLUDE_FROM_JSDOM.has(key)) continue;
        stubs[key] = dom.window[key];
    }
    return stubs;
}
let browserStubs;
export function getBrowserStubs() {
    if (!browserStubs) {
        browserStubs = collectBrowserStubs();
    }
    return browserStubs;
}

//# sourceMappingURL=stubs.js.map