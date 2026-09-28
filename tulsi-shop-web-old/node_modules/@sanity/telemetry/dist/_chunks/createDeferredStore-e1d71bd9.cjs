'use strict';

const capture = {
  capture: true
};
function listen(target, type, cb) {
  target.addEventListener(type, cb, capture);
  return () => target.removeEventListener(type, cb, capture);
}
function onPageHide(listener) {
  if ("onpagehide" in window) {
    return listen(window, "pagehide", listener);
  }
  const cleanupUnload = listen(window, "unload", listener);
  const cleanupBeforeUnload = listen(window, "unload", listener);
  return () => {
    cleanupUnload();
    cleanupBeforeUnload();
  };
}
function onVisibilityHidden(cb) {
  return listen(document, "visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      cb();
    }
  });
}
function registerLifecycleEvents(store) {
  const unregisterVisibilityHidden = onVisibilityHidden(() => store.flush());
  const unregisterPageHide = onPageHide(() => store.endWithBeacon());
  return () => {
    unregisterPageHide();
    unregisterVisibilityHidden();
  };
}
function createNoopLogger() {
  const logger = {
    updateUserProperties() {},
    trace,
    resume,
    log
  };
  function trace(telemetryTrace) {
    return {
      start() {},
      log(data) {},
      complete() {},
      newContext(name) {
        return logger;
      },
      error(error) {},
      await: promise => promise
    };
  }
  function log(event, data) {}
  function resume(events) {}
  return logger;
}
const noopLogger = createNoopLogger();
function createDeferredStore() {
  let buffer = [];
  const logger = {
    log(event, data) {
      buffer.push({
        createdAt: (/* @__PURE__ */new Date()).toISOString(),
        event,
        data
      });
    },
    trace(event) {
      return {
        start() {},
        log() {},
        complete() {},
        error() {},
        newContext() {
          return logger;
        },
        await: promise => promise
      };
    },
    updateUserProperties() {},
    resume(events) {
      buffer.push(...events);
    }
  };
  function consumeEvents() {
    const events = buffer;
    buffer = [];
    return events;
  }
  return {
    logger,
    consumeEvents
  };
}
exports.createDeferredStore = createDeferredStore;
exports.noopLogger = noopLogger;
exports.onPageHide = onPageHide;
exports.onVisibilityHidden = onVisibilityHidden;
exports.registerLifecycleEvents = registerLifecycleEvents;
//# sourceMappingURL=createDeferredStore-e1d71bd9.cjs.map
