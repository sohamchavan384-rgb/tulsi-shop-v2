import { switchMap, mergeMap, share, distinctUntilChanged, take, map, shareReplay, filter, finalize, takeUntil } from "rxjs/operators";
import { partition, fromEvent, EMPTY, of, combineLatest, merge, defer, Observable, race, timer, throwError, NEVER } from "rxjs";
import { customAlphabet } from "nanoid";
const defaultGetNextRequestId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-",
  20
), HEARTBEAT = "\u2665";
function formatRequest(method, params, id2) {
  return JSON.stringify({
    jsonrpc: "2.0",
    method,
    params: addApiVersion(params, "v1"),
    id: id2
  });
}
function tryParse(input) {
  try {
    return [null, JSON.parse(input)];
  } catch (error) {
    return error instanceof Error ? [error] : [new Error(`${error}`)];
  }
}
function addApiVersion(params, v) {
  return { ...params, apiVersion: v };
}
const createClient = (connection$, options = {}) => {
  const { token$, getNextRequestId = defaultGetNextRequestId } = options, [heartbeats$, responses$] = partition(
    connection$.pipe(
      switchMap((connection) => fromEvent(connection, "message"))
    ),
    (event) => event.data === HEARTBEAT
  ), parsedResponses$ = responses$.pipe(
    mergeMap((response) => {
      const [err, msg] = tryParse(response.data);
      return err ? (console.warn("Unable to parse message: %s", err.message), EMPTY) : !msg || !msg.jsonrpc ? (console.warn("Received empty or non-jsonrpc message: %s", msg), EMPTY) : of(msg);
    }),
    share()
  ), authedConnection$ = token$ ? combineLatest([token$, connection$]).pipe(
    distinctUntilChanged(
      ([oldToken, oldSocket], [newToken, newSocket]) => oldToken === newToken && oldSocket === newSocket
    ),
    switchMap(
      ([token, ws]) => token ? call(ws, "authorization", {
        authorization: `Bearer ${token}`
      }).pipe(
        take(1),
        map(() => ws)
      ) : of(ws)
    ),
    shareReplay({ refCount: !0, bufferSize: 1 })
  ) : connection$;
  function call(ws, method, params = {}) {
    const requestId = getNextRequestId();
    return merge(
      parsedResponses$.pipe(
        filter((rpcResult) => rpcResult.id === requestId),
        map((rpcResult) => rpcResult.result)
      ),
      defer(() => (ws.send(formatRequest(method, params, requestId)), EMPTY))
    );
  }
  function requestMethod(method, params) {
    return authedConnection$.pipe(
      take(1),
      mergeMap((ws) => call(ws, method, params).pipe(take(1)))
    );
  }
  function requestSubscribe(method, params) {
    return authedConnection$.pipe(
      take(1),
      mergeMap(
        (ws) => call(ws, `${method}_subscribe`, params).pipe(
          take(1),
          mergeMap(
            (subscriptionId) => parsedResponses$.pipe(
              filter(
                (message) => message.method === `${method}_subscription` && message.params.subscription === subscriptionId
              ),
              map((message) => message.params.result),
              finalize(() => {
                ws.readyState !== ws.CLOSED && ws.readyState !== ws.CLOSING && ws.send(
                  formatRequest(
                    `${method}_unsubscribe`,
                    { subscriptionId },
                    getNextRequestId()
                  )
                );
              })
            )
          )
        )
      )
    );
  }
  return {
    // heartbeat$ is a stream of date objects representing when the "last message was received"
    // it will keep the connection open until it is unsubscribed and can therefore be used to keep connection alive
    // between requests
    heartbeats: merge(authedConnection$, heartbeats$, responses$).pipe(
      map(() => /* @__PURE__ */ new Date())
    ),
    listen: (method, params) => requestSubscribe(method, params),
    request: (method, params) => requestMethod(method, params)
  };
};
class WebSocketError extends Error {
  type;
  code;
  reason;
  constructor(message, type, code, reason) {
    super(message), this.type = type, this.code = code, this.reason = reason;
  }
}
function createConnect(getWebsocketInstance) {
  return (url) => new Observable((subscriber) => {
    const ws = getWebsocketInstance(url);
    let didUnsubscribe = !1;
    const onOpen = () => {
      subscriber.next(ws);
    }, onError = () => {
      subscriber.error(
        new WebSocketError("WebSocket connection error", "CONNECTION_ERROR")
      );
    }, onClose = (ev) => {
      didUnsubscribe ? subscriber.complete() : subscriber.error(
        new WebSocketError(
          "WebSocket connection error",
          "CONNECTION_CLOSED",
          ev.code,
          ev.reason
        )
      );
    };
    return ws.onopen = onOpen, ws.onclose = onClose, ws.onerror = onError, () => {
      didUnsubscribe = !0, ws.close(1e3, "WebSockets connection closed by client");
    };
  });
}
const timeoutFirstWith = (due, withObservable) => (input$) => race(input$, timer(due).pipe(mergeMap(() => withObservable))), ERROR_CODES = {
  // Connection-level errors
  BAD_REQUEST: 4e3,
  UNAUTHORIZED: 4001,
  NOT_FOUND: 4004,
  // Application-level errors
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  SUBSCRIPTION_NOT_FOUND: -32602,
  PARSE_ERROR: -32700
}, id = (arg) => arg;
function fromUrl(url, options = {}) {
  const { timeout, token$ } = options, ourGlobal = globalThis, connect = createConnect(
    (url2, protocols) => new globalThis.WebSocket(url2, protocols)
  );
  return createClient(
    connect(url).pipe(
      timeout ? timeoutFirstWith(
        timeout,
        throwError(
          () => new Error(
            `Timeout after ${timeout} while establishing WebSockets connection`
          )
        )
      ) : id,
      shareReplay({ refCount: !0 }),
      takeUntil(
        // ensure graceful disconnect in browsers
        isEventTargetLike(ourGlobal) ? fromEvent(ourGlobal, "beforeunload") : NEVER
      )
    ),
    { token$ }
  );
}
function isEventTargetLike(thing) {
  return typeof thing == "object" && thing !== null && "addEventListener" in thing && typeof thing.addEventListener == "function" && "removeEventListener" in thing && typeof thing.removeEventListener == "function";
}
function fromSanityClient(client) {
  const { dataset, token } = client.config();
  return fromUrl(
    client.getUrl(`/socket/${dataset}`).replace(/^http/, "ws"),
    token ? { token$: of(token) } : {}
  );
}
export {
  ERROR_CODES,
  createClient,
  fromSanityClient,
  fromUrl
};
//# sourceMappingURL=index.js.map
