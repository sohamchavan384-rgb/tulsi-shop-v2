import { Transform, type TransformCallback, type Writable } from 'node:stream';
type TransformFunction = (chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback) => void;
type TransformObjFunction<T, R> = (chunk: T, encoding: BufferEncoding, callback: TransformCallback) => R;
export declare function through(transformFn: TransformFunction): Transform;
export declare function throughObj<T = unknown, R = void>(transformFn: TransformObjFunction<T, R>): Transform;
export declare function isWritableStream(val: unknown): val is Writable;
export declare function concat(onData: (chunks: unknown[]) => void): Transform;
export declare function split(transformFn?: (line: string) => unknown): Transform;
export {};
//# sourceMappingURL=streamHelpers.d.ts.map