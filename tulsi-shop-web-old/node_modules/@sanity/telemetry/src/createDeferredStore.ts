import type {
  DeferredEvent,
  DefinedTelemetryLog,
  DefinedTelemetryTrace,
  TelemetryLogger,
  TelemetryTrace,
} from './types'

export function createDeferredStore<UserProperties>(): {
  logger: TelemetryLogger<UserProperties>
  consumeEvents: () => DeferredEvent[]
} {
  let buffer: DeferredEvent[] = []

  const logger: TelemetryLogger<UserProperties> = {
    log<Data>(event: DefinedTelemetryLog<Data>, data?: Data) {
      buffer.push({
        createdAt: new Date().toISOString(),
        event,
        data,
      } as DeferredEvent)
    },

    trace(
      event: DefinedTelemetryTrace<unknown, unknown>,
    ): TelemetryTrace<UserProperties, unknown> {
      return {
        start() {},
        log() {},
        complete() {},
        error() {},
        newContext() {
          return logger
        },
        await: (promise: Promise<unknown>) => promise,
      }
    },

    updateUserProperties() {},

    resume(events: DeferredEvent[]) {
      buffer.push(...events)
    },
  }

  function consumeEvents(): DeferredEvent[] {
    const events = buffer
    buffer = []
    return events
  }

  return {logger, consumeEvents}
}
