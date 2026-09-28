import {Observable} from 'rxjs'
import type {WebSocketLike} from './types'

type ErrorType = 'CONNECTION_ERROR' | 'CONNECTION_CLOSED'

export class WebSocketError extends Error {
  type: ErrorType
  code: number | undefined
  reason: string | undefined
  constructor(
    message: string,
    type: ErrorType,
    code?: number,
    reason?: string,
  ) {
    super(message)
    this.type = type
    this.code = code
    this.reason = reason
  }
}

export function createConnect<T extends WebSocketLike>(
  getWebsocketInstance: (url: string, protocols?: string | string[]) => T,
) {
  return (url: string) => {
    return new Observable<T>(subscriber => {
      const ws = getWebsocketInstance(url)

      let didUnsubscribe = false

      const onOpen: WebSocketLike['onopen'] = () => {
        subscriber.next(ws)
      }

      const onError: WebSocketLike['onerror'] = () => {
        subscriber.error(
          new WebSocketError('WebSocket connection error', 'CONNECTION_ERROR'),
        )
      }

      const onClose: WebSocketLike['onclose'] = ev => {
        if (!didUnsubscribe) {
          subscriber.error(
            new WebSocketError(
              'WebSocket connection error',
              'CONNECTION_CLOSED',
              ev.code,
              ev.reason,
            ),
          )
        } else {
          subscriber.complete()
        }
      }

      ws.onopen = onOpen
      ws.onclose = onClose
      ws.onerror = onError

      return () => {
        didUnsubscribe = true
        ws.close(1000, 'WebSockets connection closed by client')
      }
    })
  }
}
