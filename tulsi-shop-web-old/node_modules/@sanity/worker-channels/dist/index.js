function withResolvers(Promise2) {
  let resolve, reject;
  return { promise: new Promise2((thisResolve, thisReject) => {
    resolve = thisResolve, reject = thisReject;
  }), resolve, reject };
}
const MESSAGE_TYPES = new Set(
  Object.keys({
    "channel-emission": null,
    "channel-end": null,
    "channel-event": null
  })
);
function isWorkerChannelMessage(message) {
  return typeof message != "object" || !message || !("type" in message) || typeof message.type != "string" || !("name" in message) || typeof message.name != "string" ? !1 : MESSAGE_TYPES.has(message.type);
}
class SimpleEmitter {
  #subscribers = /* @__PURE__ */ new Map();
  notify() {
    for (const subscriber of this.#subscribers.values())
      subscriber();
  }
  subscribe(subscriber) {
    const id = {};
    return this.#subscribers.set(id, subscriber), () => {
      this.#subscribers.delete(id);
    };
  }
}
class StreamBuffer {
  #finished = !1;
  #buffer = [];
  #error = (() => {
    const error = withResolvers(Promise);
    return error.promise.catch(() => {
    }), error;
  })();
  #target = new SimpleEmitter();
  emit = (payload) => {
    this.#buffer.push(payload), this.#target.notify();
  };
  end = () => {
    this.#finished = !0, this.#target.notify();
  };
  error = (error) => {
    this.#error.reject(error);
  };
  #ready() {
    const { promise, resolve } = withResolvers(Promise), handler = () => {
      (this.#buffer.length || this.#finished) && (unsubscribe(), resolve());
    }, unsubscribe = this.#target.subscribe(handler);
    return handler(), Promise.race([promise, this.#error.promise]).finally(unsubscribe);
  }
  async *[Symbol.asyncIterator]() {
    for (; !this.#finished || this.#buffer.length; ) {
      for (; this.#buffer.length; )
        yield this.#buffer.shift();
      await this.#ready();
    }
  }
}
class WorkerChannelReceiver {
  /**
   * Creates a WorkerChannelReceiver from a worker that supports either EventEmitter
   * or EventTarget interfaces (Node.js Worker or Web Worker).
   *
   * @param worker - The worker instance to receive messages from
   * @returns A new WorkerChannelReceiver instance
   */
  static from(worker) {
    if ("addListener" in worker)
      return new WorkerChannelReceiver((subscriber) => (worker.addListener("message", subscriber.next), worker.addListener("error", subscriber.error), () => {
        worker.removeListener("message", subscriber.next), worker.removeListener("error", subscriber.error);
      }));
    if ("addEventListener" in worker)
      return new WorkerChannelReceiver((subscriber) => (worker.addEventListener("message", subscriber.next), worker.addEventListener("error", subscriber.error), () => {
        worker.removeEventListener("message", subscriber.next), worker.removeEventListener("error", subscriber.error);
      }));
    throw new TypeError(
      "WorkerChannelReceiver.from() requires a worker that implements either the EventEmitter (Node.js Worker) or EventTarget (Web Worker) interface. Expected an object with addListener/removeListener methods or addEventListener/removeEventListener methods."
    );
  }
  #events = /* @__PURE__ */ new Map();
  #streams = /* @__PURE__ */ new Map();
  #error = (() => {
    const error = withResolvers(Promise);
    return error.promise.catch(() => {
    }), error;
  })();
  /** Function to call to unsubscribe from worker messages and clean up listeners */
  unsubscribe;
  /**
   * Creates a new WorkerChannelReceiver instance.
   *
   * @param subscribe - Function that sets up message listeners and returns cleanup function
   */
  constructor(subscribe) {
    this.unsubscribe = subscribe({
      next: this.#handleMessage,
      error: this.#handleError
    });
  }
  #handleMessage = (e) => {
    if (e && typeof e == "object") {
      if ("data" in e && isWorkerChannelMessage(e.data)) return this.#handleMessage(e.data);
      if ("detail" in e && isWorkerChannelMessage(e.detail)) return this.#handleMessage(e.detail);
      isWorkerChannelMessage(e) && (e.type === "channel-event" && this.#getEvent(e.name).resolve(e.payload), e.type === "channel-emission" && this.#getStream(e.name).emit(e.payload), e.type === "channel-end" && this.#getStream(e.name).end());
    }
  };
  #handleError = (e) => {
    typeof CustomEvent < "u" && e instanceof CustomEvent ? this.#error.reject(e.detail) : this.#error.reject(e);
  };
  #getEvent(name) {
    const event = this.#events.get(name) ?? withResolvers(Promise);
    return this.#events.has(name) || this.#events.set(name, event), event;
  }
  #getStream(name) {
    const stream = this.#streams.get(name);
    if (stream) return stream;
    const newStream = new StreamBuffer();
    return this.#streams.set(name, newStream), this.#error.promise.catch(newStream.error), newStream;
  }
  /**
   * Provides typed access to event receivers. Each property corresponds to an event
   * defined in the channel definition and returns a function that resolves when
   * the event is received from the worker.
   */
  event = new Proxy(/* @__PURE__ */ Object.create(null), {
    get: (...[target, name]) => {
      if (typeof name == "string")
        return target[name] ??= () => Promise.race([this.#getEvent(name).promise, this.#error.promise]);
    }
  });
  /**
   * Provides typed access to stream receivers. Each property corresponds to a stream
   * defined in the channel definition and returns a function that returns an async
   * iterator for receiving streamed data from the worker.
   */
  stream = new Proxy(/* @__PURE__ */ Object.create(null), {
    get: (...[target, name]) => {
      if (typeof name == "string")
        return target[name] ??= () => this.#getStream(name);
    }
  });
}
class WorkerChannelReporter {
  /**
   * Creates a WorkerChannelReporter from a parent port or event target.
   * Supports Node.js parentPort, EventTarget, EventEmitter, or custom ParentPortLike objects.
   *
   * @param parentPort - The parent port or event target to send messages to
   * @returns A new WorkerChannelReporter instance
   * @throws Error if parentPort is null or doesn't implement required interface
   */
  static from(parentPort) {
    if (!parentPort)
      throw new Error(
        `WorkerChannelReporter.from() requires a valid parent port. Expected a non-null object, but received: ${String(parentPort)}.`
      );
    if ("postMessage" in parentPort)
      return new WorkerChannelReporter((message) => parentPort.postMessage(message));
    if ("dispatchEvent" in parentPort && "addEventListener" in parentPort && typeof CustomEvent < "u")
      return new WorkerChannelReporter(
        (message) => parentPort.dispatchEvent(new CustomEvent("message", { detail: message }))
      );
    if ("emit" in parentPort && "addListener" in parentPort)
      return new WorkerChannelReporter(
        (message) => parentPort.emit("message", message)
      );
    throw new TypeError(
      "WorkerChannelReporter.from() requires a parent port that implements one of the supported interfaces: ParentPortLike (with a postMessage method), EventTarget (with dispatchEvent), or EventEmitter (with emit method). The provided object does not implement any of these interfaces."
    );
  }
  #postMessage;
  #reportedEvents = /* @__PURE__ */ new Set();
  #finishedStreams = /* @__PURE__ */ new Set();
  /**
   * Creates a new WorkerChannelReporter instance.
   *
   * @param postMessage - Function to send messages to the parent process
   */
  constructor(postMessage) {
    this.#postMessage = postMessage;
  }
  /**
   * Provides typed access to event reporters. Each property corresponds to an event
   * defined in the channel definition and returns a function that sends the event
   * to the parent process. Each event can only be reported once.
   */
  event = new Proxy(/* @__PURE__ */ Object.create(null), {
    get: (...[target, name]) => {
      if (typeof name == "string")
        return target[name] ??= (payload) => {
          if (this.#reportedEvents.has(name))
            throw new Error(
              `Cannot report event "${name}" because it has already been reported. Each event in a worker channel can only be reported and received once.`
            );
          this.#reportedEvents.add(name), this.#postMessage({ type: "channel-event", name, payload });
        };
    }
  });
  /**
   * Provides typed access to stream reporters. Each property corresponds to a stream
   * defined in the channel definition and returns an object with `emit()` and `end()`
   * methods for sending streaming data to the parent process.
   */
  stream = new Proxy(/* @__PURE__ */ Object.create(null), {
    get: (...[target, name]) => {
      if (typeof name == "string")
        return target[name] ??= {
          emit: (payload) => {
            if (this.#finishedStreams.has(name))
              throw new Error(
                `Cannot emit to stream "${name}" because it has already been finished. Once a stream is ended with .end(), no more data can be emitted to it.`
              );
            this.#postMessage({ type: "channel-emission", name, payload });
          },
          end: () => {
            if (this.#finishedStreams.has(name))
              throw new Error(
                `Cannot end stream "${name}" because it has already been finished. Each stream can only be ended once.`
              );
            this.#finishedStreams.add(name), this.#postMessage({ type: "channel-end", name });
          }
        };
    }
  });
}
export {
  WorkerChannelReceiver,
  WorkerChannelReporter,
  isWorkerChannelMessage
};
//# sourceMappingURL=index.js.map
