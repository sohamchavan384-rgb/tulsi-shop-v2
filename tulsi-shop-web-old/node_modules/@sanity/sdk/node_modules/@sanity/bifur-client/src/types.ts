import type {Observable} from 'rxjs'

/**
 * @public
 */
export type RequestMethod =
  | 'doc'
  | 'query'
  | 'mutate'
  | 'presence_rollcall'
  | 'presence_announce'
  | 'presence_disconnect'
  // authorization is both a request method (performs actual authorization) _AND_
  // a subscription method (emits authorization events, eg expiring tokens)
  | 'authorization'

/**
 * @public
 */
export type SubscribeMethods =
  | 'presence'
  | 'listen'
  // authorization is both a request method (performs actual authorization) _AND_
  // a subscription method (emits authorization events, eg expiring tokens)
  | 'authorization'

/**
 * @public
 */
export type RequestParams = Record<string, any>

export type JSONRpcMessage<T> = {
  jsonrpc: string
  id: string
  method: string
  params: RequestParams
  result: T
}

/**
 * @public
 */
export interface BifurClient {
  heartbeats: Observable<Date>
  listen: <T>(method: SubscribeMethods, params?: RequestParams) => Observable<T>
  request: <T>(method: RequestMethod, params?: RequestParams) => Observable<T>
}

/**
 * @public
 */
export interface SanityClientLike {
  config(): {dataset: string; token?: string}
  getUrl(path: string): string
}

/**
 * @internal
 */
export interface EventTargetLike {
  addEventListener(
    type: string,
    listener: (evt: Event) => void,
    options?: boolean,
  ): void
  removeEventListener(
    type: string,
    listener: (evt: Event) => void,
    options?: boolean,
  ): void
}

/**
 * @internal
 */
export interface CloseEventLike {
  reason: string
  code: number
  wasClean: boolean
}

/**
 * @internal
 */
export interface WebSocketLike {
  onclose: ((this: this, ev: any) => any) | null
  onerror: ((this: this, ev: any) => any) | null
  onmessage: ((this: this, ev: MessageEvent) => any) | null
  onopen: ((this: this, ev: any) => any) | null
  close(code?: number, reason?: string): void
}
