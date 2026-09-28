import { performance } from 'node:perf_hooks';
/**
 * Starts a terminal timer
 *
 * @internal
 */ export function getTimer() {
    const timings = {};
    const startTimes = {};
    function start(name) {
        if (startTimes[name] !== undefined) {
            throw new TypeError(`Timer "${name}" already started, cannot overwrite`);
        }
        startTimes[name] = performance.now();
    }
    function end(name) {
        if (startTimes[name] === undefined) {
            throw new TypeError(`Timer "${name}" never started, cannot end`);
        }
        timings[name] = performance.now() - startTimes[name];
        return timings[name];
    }
    return {
        end,
        getTimings: ()=>timings,
        start
    };
}

//# sourceMappingURL=timer.js.map