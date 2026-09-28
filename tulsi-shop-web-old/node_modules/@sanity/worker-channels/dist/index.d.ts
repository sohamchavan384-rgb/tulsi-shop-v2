import {EventEmitter} from 'node:events'

declare type DefinitionKeys<TDefinition extends WorkerChannel.Definition> =
  keyof TDefinition['__definition']

declare type EventKeys<TDefinition extends WorkerChannel.Definition> = {
  [K in DefinitionKeys<TDefinition>]: PickDefinition<
    TDefinition,
    K
  > extends WorkerChannel.Event<any>
    ? K
    : never
}[DefinitionKeys<TDefinition>]

declare type EventMessage<TPayload = unknown> = {
  type: 'channel-event'
  name: string
  payload: TPayload
}

declare type EventReceiver<TPayload = unknown> = () => Promise<TPayload>

declare type EventReceivers<TDefinition extends WorkerChannel.Definition> = {
  [K in EventKeys<TDefinition>]: PickDefinition<TDefinition, K> extends WorkerChannel.Event<
    infer TPayload
  >
    ? EventReceiver<TPayload>
    : never
}

declare type EventReporter<TPayload = unknown> = (payload: TPayload) => void

declare type EventReporters<TDefinition extends WorkerChannel.Definition> = {
  [K in EventKeys<TDefinition>]: PickDefinition<TDefinition, K> extends WorkerChannel.Event<
    infer TPayload
  >
    ? EventReporter<TPayload>
    : never
}

/**
 * Type guard function that checks if an unknown value is a valid WorkerChannelMessage.
 * This is used to validate incoming messages from worker threads.
 *
 * @public
 */
export declare function isWorkerChannelMessage(message: unknown): message is WorkerChannelMessage

/**
 * Interface for objects that can send messages to a parent process.
 * This provides a common abstraction for different types of parent ports
 * used in various worker environments.
 *
 * @public
 */
export declare interface ParentPortLike {
  /** Sends a message to the parent process */
  postMessage: (message: unknown) => void
}

declare type PickDefinition<
  TDefinition extends WorkerChannel.Definition,
  K extends DefinitionKeys<TDefinition>,
> = TDefinition['__definition'][K]

declare interface ReceiverSubscriber {
  next: (message: unknown) => void
  error: (error: unknown) => void
}

declare type StreamEmissionMessage<TPayload = unknown> = {
  type: 'channel-emission'
  name: string
  payload: TPayload
}

declare type StreamEndMessage = {
  type: 'channel-end'
  name: string
}

declare type StreamKeys<TDefinition extends WorkerChannel.Definition> = {
  [K in DefinitionKeys<TDefinition>]: PickDefinition<
    TDefinition,
    K
  > extends WorkerChannel.Stream<any>
    ? K
    : never
}[DefinitionKeys<TDefinition>]

declare type StreamReceiver<TPayload = unknown> = () => AsyncIterable<TPayload>

declare type StreamReceivers<TDefinition extends WorkerChannel.Definition> = {
  [K in StreamKeys<TDefinition>]: PickDefinition<TDefinition, K> extends WorkerChannel.Stream<
    infer TPayload
  >
    ? StreamReceiver<TPayload>
    : never
}

declare type StreamReporter<TPayload = unknown> = {
  emit: (payload: TPayload) => void
  end: () => void
}

declare type StreamReporters<TDefinition extends WorkerChannel.Definition> = {
  [K in StreamKeys<TDefinition>]: PickDefinition<TDefinition, K> extends WorkerChannel.Stream<
    infer TPayload
  >
    ? StreamReporter<TPayload>
    : never
}

/**
 * Worker channel namespace containing types for defining structured communication
 * channels between worker threads and their parent processes.
 *
 * @example
 * ```ts
 * // Define the channel interface (shared between parent and worker)
 * // --- In a types file (e.g., types.ts) ---
 * export type MyWorkerChannel = WorkerChannel.Definition<{
 *   compileStart: WorkerChannel.Event<void>
 *   compileProgress: WorkerChannel.Stream<{ file: string; progress: number }>
 *   compileEnd: WorkerChannel.Event<{ duration: number }>
 * }>
 *
 * // --- In the worker file (e.g., worker.ts) ---
 * import {type MyWorkerChannel} from './types.ts'
 * import {parentPort} from 'node:worker_threads';
 *
 * const report = WorkerChannelReporter.from<MyWorkerChannel>(parentPort);
 *
 * async function runCompilation() {
 *   report.event.compileStart(); // Signal start
 *
 *   const files = ['a.js', 'b.js', 'c.js'];
 *   for (const file of files) {
 *     // Simulate work and report progress
 *     await new Promise(resolve => setTimeout(resolve, 100));
 *     report.stream.compileProgress.emit({ file, progress: 100 });
 *   }
 *   report.stream.compileProgress.end(); // Signal end of progress stream
 *
 *   report.event.compileEnd({ duration: 300 }); // Signal end with result
 * }
 *
 * runCompilation();
 *
 * // --- In the parent file (e.g., main.ts) ---
 * import {type MyWorkerChannel} from './types.ts'
 * import {Worker} from 'node:worker_threads';
 *
 * const worker = new Worker('./worker.js');
 * const receiver = WorkerChannelReceiver.from<MyWorkerChannel>(worker);
 *
 * async function monitorCompilation() {
 *   console.log('Waiting for compilation to start...');
 *   await receiver.event.compileStart();
 *   console.log('Compilation started.');
 *
 *   console.log('Receiving progress:');
 *   for await (const progress of receiver.stream.compileProgress()) {
 *     console.log(`  - ${progress.file}: ${progress.progress}%`);
 *   }
 *
 *   console.log('Waiting for compilation to end...');
 *   const { duration } = await receiver.event.compileEnd();
 *   console.log(`Compilation finished in ${duration}ms.`);
 *
 *   receiver.unsubscribe(); // Clean up listeners
 * }
 *
 * monitorCompilation();
 * ```
 *
 * @public
 */
export declare namespace WorkerChannel {
  /**
   * Allows declaring the names of events and stream types for a worker channel,
   * acting as the contract that specifying what events and streams can be
   * communicated between a worker and its parent process.
   *
   * @public
   */
  export interface Definition<
    TDefinition extends Record<string, Event<unknown> | Stream<unknown>> = Record<
      string,
      Event<unknown> | Stream<unknown>
    >,
  > {
    readonly __kind: 'definition'
    readonly __definition: TDefinition
  }
  /**
   * Represents a one-time event that can be sent from worker to parent.
   * Events are fire-and-forget messages that can only be sent once per channel.
   *
   * @public
   */
  export interface Event<TPayload = void> {
    readonly __kind: 'event'
    readonly __payload: TPayload
  }
  /**
   * Represents a stream of data that can be sent from worker to parent.
   * Streams allow multiple emissions of data followed by an end signal.
   *
   * @public
   */
  export interface Stream<TPayload = void> {
    readonly __kind: 'stream'
    readonly __payload: TPayload
  }
}

/**
 * Union type representing all possible message types that can be sent through worker channels.
 * These messages are used for communication between worker and parent processes.
 *
 * @public
 */
export declare type WorkerChannelMessage = EventMessage | StreamEmissionMessage | StreamEndMessage

/**
 * Receives messages from a worker thread and provides typed access to events and streams
 * defined in the worker channel definition. This class subscribes to incoming messages
 * from the worker and returns promises for events and async iterators for streams.
 *
 * @example
 * ```ts
 * // Create receiver from a Node.js Worker
 * import {Worker} from 'node:worker_threads';
 * import {type WorkerChannel, WorkerChannelReceiver} from '@sanity/worker-channels'
 *
 * type MyChannel = WorkerChannel.Definition<{
 *   myEvent: WorkerChannel.Event<string>
 *   myStream: WorkerChannel.Stream<string>
 * }>
 * const worker = new Worker('./my-worker.js');
 * const receiver = WorkerChannelReceiver.from<MyChannel>(worker);
 *
 * // Listen for events
 * const result = await receiver.event.myEvent();
 *
 * // Iterate over stream data
 * for await (const data of receiver.stream.myStream()) {
 *   console.log('Received:', data);
 * }
 *
 * // Clean up when done
 * receiver.unsubscribe();
 * ```
 *
 * @public
 */
export declare class WorkerChannelReceiver<TDefinition extends WorkerChannel.Definition> {
  #private
  /**
   * Creates a WorkerChannelReceiver from a worker that supports either EventEmitter
   * or EventTarget interfaces (Node.js Worker or Web Worker).
   *
   * @param worker - The worker instance to receive messages from
   * @returns A new WorkerChannelReceiver instance
   */
  static from<TDefinition extends WorkerChannel.Definition>(
    worker: EventTarget | EventEmitter,
  ): WorkerChannelReceiver<TDefinition>
  /** Function to call to unsubscribe from worker messages and clean up listeners */
  unsubscribe: () => void
  /**
   * Creates a new WorkerChannelReceiver instance.
   *
   * @param subscribe - Function that sets up message listeners and returns cleanup function
   */
  constructor(subscribe: (subscriber: ReceiverSubscriber) => () => void)
  /**
   * Provides typed access to event receivers. Each property corresponds to an event
   * defined in the channel definition and returns a function that resolves when
   * the event is received from the worker.
   */
  event: EventReceivers<TDefinition>
  /**
   * Provides typed access to stream receivers. Each property corresponds to a stream
   * defined in the channel definition and returns a function that returns an async
   * iterator for receiving streamed data from the worker.
   */
  stream: StreamReceivers<TDefinition>
}

/**
 * Reports events and streams from a worker thread to its parent process.
 * This class provides typed methods for sending events and streaming data
 * according to the worker channel definition.
 *
 * @param TDefinition - The worker channel definition interface
 *
 * @example
 * ```ts
 * // Inside a worker thread
 * import {parentPort} from 'node:worker_threads';
 * import {type WorkerChannel, WorkerChannelReporter} from '@sanity/worker-channels'
 *
 * type MyChannel = WorkerChannel.Definition<{
 *   taskCompleted: WorkerChannel.Event<{result: 'success' | 'failure'}>
 *   progress: WorkerChannel.Stream<{percent: number}>
 * }>
 *
 * const report = WorkerChannelReporter.from<MyChannel>(parentPort);
 *
 * // Report a one-time event
 * report.event.taskCompleted({ result: 'success' });
 *
 * // Stream progress updates
 * for (let i = 0; i <= 100; i += 10) {
 *   report.stream.progress.emit({ percent: i });
 *   await new Promise(resolve => setTimeout(resolve, 100));
 * }
 * report.stream.progress.end();
 * ```
 *
 * @public
 */
export declare class WorkerChannelReporter<TDefinition extends WorkerChannel.Definition> {
  #private
  /**
   * Creates a WorkerChannelReporter from a parent port or event target.
   * Supports Node.js parentPort, EventTarget, EventEmitter, or custom ParentPortLike objects.
   *
   * @param parentPort - The parent port or event target to send messages to
   * @returns A new WorkerChannelReporter instance
   * @throws Error if parentPort is null or doesn't implement required interface
   */
  static from<TDefinition extends WorkerChannel.Definition>(
    parentPort: ParentPortLike | EventTarget | EventEmitter | null,
  ): WorkerChannelReporter<TDefinition>
  /**
   * Creates a new WorkerChannelReporter instance.
   *
   * @param postMessage - Function to send messages to the parent process
   */
  constructor(postMessage: (message: WorkerChannelMessage) => void)
  /**
   * Provides typed access to event reporters. Each property corresponds to an event
   * defined in the channel definition and returns a function that sends the event
   * to the parent process. Each event can only be reported once.
   */
  event: EventReporters<TDefinition>
  /**
   * Provides typed access to stream reporters. Each property corresponds to a stream
   * defined in the channel definition and returns an object with `emit()` and `end()`
   * methods for sending streaming data to the parent process.
   */
  stream: StreamReporters<TDefinition>
}

export {}
