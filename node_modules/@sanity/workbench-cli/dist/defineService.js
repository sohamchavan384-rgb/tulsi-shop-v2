import { SERVICE_CONTRACT_VERSION } from './contract.js';
/**
 * Define a Sanity Workbench background service. The first argument narrows the
 * callback shape — `"worker"` runs the callback inside a Web Worker, where it
 * can emit dock-badge updates and return a disposer.
 *
 * Identity at runtime: returns the callback tagged with its type and the contract
 * version, for the CLI build to generate a worker artifact from. Used as the
 * default export of a service's `src` file.
 * @public
 */ export function unstable_defineService(type, run) {
    return {
        run,
        type,
        version: SERVICE_CONTRACT_VERSION
    };
}

//# sourceMappingURL=defineService.js.map