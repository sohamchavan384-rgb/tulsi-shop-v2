import type React from 'react'
import {createContext, useEffect} from 'react'
import {TelemetryLogger, TelemetryStore} from '../types'
import {useTelemetryStoreLifeCycleEvents} from './useTelemetryStoreLifeCycleEvents'
import {useDeferredEvents} from './DeferredTelemetryProvider'
import {noopLogger} from '../noopLogger'

/**
 * @internal
 */
export const TelemetryLoggerContext =
  createContext<TelemetryLogger<unknown>>(noopLogger)

export function TelemetryProvider<UserProperties>({
  children,
  store,
}: {
  children: React.ReactNode
  store: TelemetryStore<UserProperties>
}) {
  const consumeDeferredEvents = useDeferredEvents()

  // Resume any deferred events from a parent DeferredTelemetryProvider
  useEffect(() => {
    if (consumeDeferredEvents) {
      store.logger.resume(consumeDeferredEvents())
    }
  }, [store, consumeDeferredEvents])

  // Hook the telemetry store up to page life cycle events like hide/unload
  useTelemetryStoreLifeCycleEvents(store)

  return (
    <TelemetryLoggerContext.Provider value={store.logger}>
      {children}
    </TelemetryLoggerContext.Provider>
  )
}
