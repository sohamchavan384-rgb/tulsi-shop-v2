import {Observable} from 'rxjs'

/**
 * @public
 */
export declare interface BifurClient {
  heartbeats: Observable<Date>
  listen: <T>(method: SubscribeMethods, params?: RequestParams) => Observable<T>
  request: <T>(method: RequestMethod, params?: RequestParams) => Observable<T>
}

/**
 * @public
 */
export declare interface BifurClientOptions {
  token$?: Observable<string | null>
  getNextRequestId?: () => string
}

/**
 * Create a Bifur client
 *
 * @param connection$ - An observable of WebSocket connections
 * @param options - Options for the client
 * @returns A Bifur client
 * @public
 */
export declare const createClient: (
  connection$: Observable<WebSocket>,
  options?: BifurClientOptions,
) => BifurClient

/**
 * @public
 */
export declare const ERROR_CODES: {
  readonly BAD_REQUEST: 4000
  readonly UNAUTHORIZED: 4001
  readonly NOT_FOUND: 4004
  readonly INVALID_REQUEST: -32600
  readonly METHOD_NOT_FOUND: -32601
  readonly INVALID_PARAMS: -32602
  readonly SUBSCRIPTION_NOT_FOUND: -32602
  readonly PARSE_ERROR: -32700
}

/**
 * @public
 */
export declare type ERROR_CODES = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * Create a Bifur client from a `@sanity/client`-like instance
 *
 * @param client - A `@sanity/client`-like instance
 * @returns A Bifur client instance
 * @public
 */
export declare function fromSanityClient(client: SanityClientLike): BifurClient

/**
 * Create a BifurClient from a WebSocket URL
 *
 * @param url - The URL to connect to
 * @param options - Options for the client
 * @returns A Bifur client instance
 * @public
 */
export declare function fromUrl(
  url: string,
  options?: FromUrlOptions,
): BifurClient

/**
 * @public
 */
export declare interface FromUrlOptions {
  timeout?: number
  token$?: Observable<string | null>
}

/**
 * @public
 */
export declare type RequestMethod =
  | 'doc'
  | 'query'
  | 'mutate'
  | 'presence_rollcall'
  | 'presence_announce'
  | 'presence_disconnect'
  | 'authorization'

/**
 * @public
 */
export declare type RequestParams = Record<string, any>

/**
 * @public
 */
export declare interface SanityClientLike {
  config(): {
    dataset: string
    token?: string
  }
  getUrl(path: string): string
}

/**
 * @public
 */
export declare type SubscribeMethods = 'presence' | 'listen' | 'authorization'

export {}
