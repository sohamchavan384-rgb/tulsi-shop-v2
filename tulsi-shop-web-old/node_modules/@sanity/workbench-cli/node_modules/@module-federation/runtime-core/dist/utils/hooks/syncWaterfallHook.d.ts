import { SyncHook } from "./syncHook.js";

//#region src/utils/hooks/syncWaterfallHook.d.ts
declare class SyncWaterfallHook<T extends Record<string, any>> extends SyncHook<[T], T | void> {
  onerror: (errMsg: string | Error | unknown) => void;
  constructor(type: string);
  emit(data: T): T;
}
//#endregion
export { SyncWaterfallHook };
//# sourceMappingURL=syncWaterfallHook.d.ts.map