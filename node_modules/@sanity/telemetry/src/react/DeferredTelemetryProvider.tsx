import React, {useState} from 'react'
import {createContext, useContext, useRef} from 'react'
import {createDeferredStore} from '../createDeferredStore'
import {TelemetryLoggerContext} from './TelemetryProvider'
import type {DeferredEvent} from '../types'

/**
 * @internal
 */
export const DeferredEventsContext = createContext<
  (() => DeferredEvent[]) | null
>(null)

/**
 * @internal
 */
export function useDeferredEvents(): (() => DeferredEvent[]) | null {
  return useContext(DeferredEventsContext)
}

export function DeferredTelemetryProvider<UserProperties>({
  children,
}: {
  children: React.ReactNode
}) {
  const [deferredStore] = useState(() => createDeferredStore<UserProperties>())

  return (
    <DeferredEventsContext.Provider value={deferredStore.consumeEvents}>
      <TelemetryLoggerContext.Provider value={deferredStore.logger}>
        {children}
      </TelemetryLoggerContext.Provider>
    </DeferredEventsContext.Provider>
  )
}
