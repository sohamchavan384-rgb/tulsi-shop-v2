/**
 * Result of starting an app/studio dev server. Discriminated on `started` so
 * callers handle the didn't-start case explicitly instead of null-checking
 * optional fields. A server that fails to *boot* still throws — the
 * not-started arm is reserved for expected early exits the server has
 * already reported to the user.
 */ export { };

//# sourceMappingURL=types.js.map