import { useEffect, createContext, useState, useContext } from 'react';
import { jsx } from 'react/jsx-runtime';
import { onVisibilityHidden, onPageHide, createDeferredStore, noopLogger } from '../_chunks/createDeferredStore-5760b8dc.js';
function useTelemetryStoreLifeCycleEvents(store) {
  useEffect(() => onVisibilityHidden(store.flush), [store.flush]);
  useEffect(() => onPageHide(store.endWithBeacon), [store.endWithBeacon]);
}
const DeferredEventsContext = createContext(null);
function useDeferredEvents() {
  return useContext(DeferredEventsContext);
}
function DeferredTelemetryProvider(_ref) {
  let {
    children
  } = _ref;
  const [deferredStore] = useState(() => createDeferredStore());
  return /* @__PURE__ */jsx(DeferredEventsContext.Provider, {
    value: deferredStore.consumeEvents,
    children: /* @__PURE__ */jsx(TelemetryLoggerContext.Provider, {
      value: deferredStore.logger,
      children
    })
  });
}
const TelemetryLoggerContext = createContext(noopLogger);
function TelemetryProvider(_ref2) {
  let {
    children,
    store
  } = _ref2;
  const consumeDeferredEvents = useDeferredEvents();
  useEffect(() => {
    if (consumeDeferredEvents) {
      store.logger.resume(consumeDeferredEvents());
    }
  }, [store, consumeDeferredEvents]);
  useTelemetryStoreLifeCycleEvents(store);
  return /* @__PURE__ */jsx(TelemetryLoggerContext.Provider, {
    value: store.logger,
    children
  });
}
function useTelemetry() {
  return useContext(TelemetryLoggerContext);
}
export { DeferredTelemetryProvider, TelemetryProvider, useTelemetry, useTelemetryStoreLifeCycleEvents };
//# sourceMappingURL=index.js.map
