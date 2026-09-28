import {expect, test, vi, describe} from 'vitest'
import {createDeferredStore} from '../createDeferredStore'
import {ExampleEvent, ExampleTrace} from './exampleEvents.telemetry'
import type {DeferredEvent} from '../types'
import {noopLogger} from '../noopLogger'

test('buffered events are returned by consumeEvents()', () => {
  const {logger, consumeEvents} = createDeferredStore()

  logger.log(ExampleEvent, {foo: 'bar'})

  const events = consumeEvents()
  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({
    event: ExampleEvent,
    data: {foo: 'bar'},
  })
})

test('consumeEvents() drains the buffer', () => {
  const {logger, consumeEvents} = createDeferredStore()

  logger.log(ExampleEvent, {foo: 'bar'})

  expect(consumeEvents()).toHaveLength(1)
  expect(consumeEvents()).toHaveLength(0)
})

test('timestamps are captured at log time', () => {
  vi.useFakeTimers()
  try {
    const {logger, consumeEvents} = createDeferredStore()

    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
    logger.log(ExampleEvent, {foo: 'bar'})

    vi.setSystemTime(new Date('2024-01-01T00:00:01.000Z'))
    logger.log(ExampleEvent, {foo: 'bar'})

    const events = consumeEvents()
    expect(events[0]?.createdAt).toBe('2024-01-01T00:00:00.000Z')
    expect(events[1]?.createdAt).toBe('2024-01-01T00:00:01.000Z')
  } finally {
    vi.useRealTimers()
  }
})

test('event definitions are preserved', () => {
  const {logger, consumeEvents} = createDeferredStore()

  logger.log(ExampleEvent, {foo: 'bar'})

  const events = consumeEvents()
  expect(events[0]?.event).toBe(ExampleEvent)
  expect(events[0]?.event.name).toBe('ExampleEvent')
  expect(events[0]?.event.version).toBe(1)
})

test('resume() appends events to the buffer', () => {
  const {logger, consumeEvents} = createDeferredStore()

  logger.log(ExampleEvent, {foo: 'bar'})

  logger.resume([
    {
      createdAt: '2024-01-01T00:00:00.000Z',
      event: ExampleEvent,
      data: {foo: 'bar'},
    },
  ])

  const events = consumeEvents()
  expect(events).toHaveLength(2)
})

test('trace() returns a noop trace', () => {
  const {logger} = createDeferredStore()

  const trace = logger.trace(ExampleTrace)

  // Should not throw
  trace.start()
  trace.log(undefined)
  trace.complete()
  trace.error(new Error('test'))

  // newContext returns the same logger interface
  const ctx = trace.newContext('sub')
  expect(ctx).toBe(logger)
})

test('trace().await() passes through the promise', async () => {
  const {logger} = createDeferredStore()
  const trace = logger.trace(ExampleTrace)

  const result = await trace.await(Promise.resolve('hello'))
  expect(result).toBe('hello')
})

test('updateUserProperties() is a noop', () => {
  const {logger, consumeEvents} = createDeferredStore()

  // Should not throw or buffer anything
  logger.updateUserProperties({role: 'admin'})
  expect(consumeEvents()).toHaveLength(0)
})

test('multiple log calls buffer in order', () => {
  const {logger, consumeEvents} = createDeferredStore()

  logger.log(ExampleEvent, {foo: 'bar'})
  logger.log(ExampleEvent, {foo: 'bar'})
  logger.log(ExampleEvent, {foo: 'bar'})

  const events = consumeEvents()
  expect(events).toHaveLength(3)
})

test('consumeEvents() drains into a real store via resume()', () => {
  const {logger: deferred, consumeEvents} = createDeferredStore()

  deferred.log(ExampleEvent, {foo: 'bar'})
  deferred.log(ExampleEvent, {foo: 'bar'})

  // Simulate what TelemetryProvider does on mount
  const resumed: DeferredEvent[] = []
  const mockLogger = {
    ...noopLogger,
    resume(events: DeferredEvent[]) {
      resumed.push(...events)
    },
  }

  mockLogger.resume(consumeEvents())

  expect(resumed).toHaveLength(2)
  expect(resumed[0]).toMatchObject({event: ExampleEvent, data: {foo: 'bar'}})

  // Buffer is now empty
  expect(consumeEvents()).toHaveLength(0)
})
