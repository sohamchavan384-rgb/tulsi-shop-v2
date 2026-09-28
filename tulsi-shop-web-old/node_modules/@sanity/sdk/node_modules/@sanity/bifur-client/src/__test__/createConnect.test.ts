import {describe, expect, it} from 'vitest'
import {createConnect, WebSocketError} from '../createConnect'
import {catchError, take, takeUntil, tap, toArray} from 'rxjs/operators'
import {lastValueFrom, of, timer} from 'rxjs'
import type {WebSocketLike} from '../types'

const createMockWS = (): WebSocketLike => ({
  onclose: null,
  onerror: null,
  onmessage: null,
  onopen: null,
  close(_code?: number, _reason?: string) {},
})

// TypeScript is weird and won't let us do type-narrowing on globalThis,
// so we do a dance in order to check for properties that are not defined
// in the `globalThis` typings, but might still be present at runtime.
const ourGlobal: unknown = globalThis

// Use CloseEvent from global if it exists, otherwise create a minimal mock
// that replicates it with the properties we need.
const CloseEvent =
  typeof ourGlobal === 'object' &&
  ourGlobal !== null &&
  'CloseEvent' in ourGlobal &&
  typeof (ourGlobal as any).CloseEvent !== 'undefined'
    ? (ourGlobal as any).CloseEvent
    : class CloserEvent extends Event {
        reason: string
        code: number
        wasClean: boolean

        constructor(
          type: string,
          init: {reason: string; code: number; wasClean: boolean},
        ) {
          super(type)
          this.reason = init.reason
          this.code = init.code
          this.wasClean = init.wasClean
        }
      }

describe('createConnect', () => {
  it('emits the connection upon successfully open', async () => {
    const mockWs = createMockWS()
    const connect = createConnect(() => mockWs)

    const conn$ = connect('https://mock')
    setTimeout(() => {
      mockWs.onopen!({})
    }, 100)

    await lastValueFrom(
      conn$.pipe(
        tap(ws => {
          expect(ws).toBe(mockWs)
        }),
        take(1),
      ),
    )
  })

  it('closes the connection gracefully upon unsubscribe', async () => {
    const mockWs = createMockWS()

    const connect = createConnect(() => mockWs)

    const conn$ = connect('https://mock')

    const closed = new Promise<{code: number; reason: string}>(
      resolve =>
        (mockWs.close = (code: number, reason: string) =>
          resolve({code, reason})),
    )

    const defaultValue = {}

    const [closeEvent, connection] = await Promise.all([
      closed,
      lastValueFrom(conn$.pipe(takeUntil(timer(100))), {defaultValue}),
    ])

    expect(closeEvent.code).toBe(1000)

    // we expect defaultValue from the observable since onopen didn't happen
    // before close so the connection should never emit any value
    expect(connection).toBe(defaultValue)
  })

  it('throws a connection error if the connection emits an error', async () => {
    const mockWs = createMockWS()
    const connect = createConnect(() => mockWs)

    const conn$ = connect('https://mock')

    setTimeout(() => {
      mockWs.onerror!({})
    }, 10)

    const res = await lastValueFrom(
      conn$.pipe(
        catchError((err: unknown) => of(err)),
        toArray(),
      ),
    )

    expect(res.length).toBe(1)
    expect(res[0]).toBeInstanceOf(Error)
    const err0 = res[0]
    if (!(err0 instanceof WebSocketError))
      throw new Error('Expected WebSocketError')
    expect(err0.type).toEqual('CONNECTION_ERROR')
  })

  it('throws an error on unexpected close', async () => {
    const mockWs = createMockWS()
    const connect = createConnect(() => mockWs)

    const conn$ = connect('https://mock')

    setTimeout(() => {
      mockWs.onclose!(
        new CloseEvent('close', {
          reason: 'Unexpected close',
          code: 1006,
          wasClean: false,
        }),
      )
    }, 10)

    const res = await lastValueFrom(
      conn$.pipe(
        catchError((err: unknown) => of(err)),
        toArray(),
      ),
    )

    expect(res.length).toBe(1)
    expect(res[0]).toBeInstanceOf(Error)
    const err1 = res[0]
    if (!(err1 instanceof WebSocketError))
      throw new Error('Expected WebSocketError')
    expect(err1.type).toEqual('CONNECTION_CLOSED')
    expect(err1.code).toEqual(1006)
    expect(err1.reason).toEqual('Unexpected close')
  })
})
