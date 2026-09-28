import { SyncHook } from "./syncHook.js";

//#region src/utils/hooks/asyncWaterfallHooks.d.ts
type CallbackReturnType<T> = T | void | Promise<T | void>;
declare class AsyncWaterfallHook<T extends object> extends SyncHook<[T], CallbackReturnType<T>> {
  onerror: (errMsg: string | Error | unknown) => void;
  constructor(type: string);
  emit(data: T): Promise<T>;
}
//#endregion
export { AsyncWaterfallHook };
//# sourceMappingURL=asyncWaterfallHooks.d.ts.map