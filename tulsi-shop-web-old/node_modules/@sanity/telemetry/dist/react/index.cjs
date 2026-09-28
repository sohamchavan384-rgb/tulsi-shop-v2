'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var react = require('react');
var jsxRuntime = require('react/jsx-runtime');
var createDeferredStore = require('../_chunks/createDeferredStore-e1d71bd9.cjs');
function useTelemetryStoreLifeCycleEvents(store) {
  react.useEffect(() => createDeferredStore.onVisibilityHidden(store.flush), [store.flush]);
  react.useEffect(() => createDeferredStore.onPageHide(store.endWithBeacon), [store.endWithBeacon]);
}
const DeferredEventsContext = react.createContext(null);
function useDeferredEvents() {
  return react.useContext(DeferredEventsContext);
}
function DeferredTelemetryProvider(_ref) {
  let {
    children
  } = _ref;
  const [deferredStore] = react.useState(() => createDeferredStore.createDeferredStore());
  return /* @__PURE__ */jsxRuntime.jsx(DeferredEventsContext.Provider, {
    value: deferredStore.consumeEvents,
    children: /* @__PURE__ */jsxRuntime.jsx(TelemetryLoggerContext.Provider, {
      value: deferredStore.logger,
      children
    })
  });
}
const TelemetryLoggerContext = react.createContext(createDeferredStore.noopLogger);
function TelemetryProvider(_ref2) {
  let {
    children,
    store
  } = _ref2;
  const consumeDeferredEvents = useDeferredEvents();
  react.useEffect(() => {
    if (consumeDeferredEvents) {
      store.logger.resume(consumeDeferredEvents());
    }
  }, [store, consumeDeferredEvents]);
  useTelemetryStoreLifeCycleEvents(store);
  return /* @__PURE__ */jsxRuntime.jsx(TelemetryLoggerContext.Provider, {
    value: store.logger,
    children
  });
}
function useTelemetry() {
  return react.useContext(TelemetryLoggerContext);
}
exports.DeferredTelemetryProvider = DeferredTelemetryProvider;
exports.TelemetryProvider = TelemetryProvider;
exports.useTelemetry = useTelemetry;
exports.useTelemetryStoreLifeCycleEvents = useTelemetryStoreLifeCycleEvents;
//# sourceMappingURL=index.cjs.map
