// Inline noop implementation — avoids a runtime dependency on @sanity/telemetry
// (types-only usage keeps it as a devDependency). Explicit types ensure this
// stays structurally in sync with TelemetryLogger/TelemetryTrace.
const noopTrace = {
    await: (promise)=>promise,
    complete: ()=>{},
    error: ()=>{},
    log: ()=>{},
    newContext: ()=>noopLogger,
    start: ()=>{}
};
/**
 * Fallback logger used when telemetry has not been initialized.
 * Exported for use in tests only — do not use in plugins or external code.
 * @internal
 */ export const noopLogger = {
    log: ()=>{},
    resume: ()=>{},
    trace: ()=>noopTrace,
    updateUserProperties: ()=>{}
};

//# sourceMappingURL=noopTelemetry.js.map