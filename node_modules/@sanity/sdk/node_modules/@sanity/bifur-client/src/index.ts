import type {BifurClient, SanityClientLike, EventTargetLike} from './types'
import {createClient, type BifurClientOptions} from './createClient'
import {createConnect} from './createConnect'
import {timeoutFirstWith} from './operators'
import {shareReplay, takeUntil} from 'rxjs/operators'
import {throwError, fromEvent, type Observable, of, NEVER} from 'rxjs'

/**
 * @public
 */
export interface FromUrlOptions {
  timeout?: number
  token$?: Observable<string | null>
}

const id = <T>(arg: T): T => arg

export type {SubscribeMethods, RequestMethod, RequestParams} from './types'
export {ERROR_CODES} from './errorCodes'
export {type BifurClient, type BifurClientOptions}
export {createClient, type SanityClientLike}

/**
 * Create a BifurClient from a WebSocket URL
 *
 * @param url - The URL to connect to
 * @param options - Options for the client
 * @returns A Bifur client instance
 * @public
 */
export function fromUrl(
  url: string,
  options: FromUrlOptions = {},
): BifurClient {
  const {timeout, token$} = options

  const ourGlobal: unknown = globalThis
  const connect = createConnect<WebSocket>(
    (url: string, protocols?: string | string[]) =>
      new globalThis.WebSocket(url, protocols),
  )

  return createClient(
    connect(url).pipe(
      timeout
        ? timeoutFirstWith(
            timeout,
            throwError(
              () =>
                new Error(
                  `Timeout after ${timeout} while establishing WebSockets connection`,
                ),
            ),
          )
        : id,
      shareReplay({refCount: true}),
      takeUntil(
        // ensure graceful disconnect in browsers
        isEventTargetLike(ourGlobal)
          ? fromEvent(ourGlobal, 'beforeunload')
          : NEVER,
      ),
    ),
    {token$},
  )
}

function isEventTargetLike(thing: unknown): thing is EventTargetLike {
  return (
    typeof thing === 'object' &&
    thing !== null &&
    'addEventListener' in thing &&
    typeof thing.addEventListener === 'function' &&
    'removeEventListener' in thing &&
    typeof thing.removeEventListener === 'function'
  )
}

/**
 * Create a Bifur client from a `@sanity/client`-like instance
 *
 * @param client - A `@sanity/client`-like instance
 * @returns A Bifur client instance
 * @public
 */
export function fromSanityClient(client: SanityClientLike): BifurClient {
  const {dataset, token} = client.config()
  return fromUrl(
    client.getUrl(`/socket/${dataset}`).replace(/^http/, 'ws'),
    token ? {token$: of(token)} : {},
  )
}
