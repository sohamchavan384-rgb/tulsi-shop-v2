export function validateFunctionName(name) {
    // must be 3+ characters, no special characters, no spaces, allow _ and -
    return /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,}$/.test(name);
}
