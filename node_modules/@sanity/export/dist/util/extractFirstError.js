function isAggregateError(err) {
    if (typeof err !== 'object' || err === null) {
        return false;
    }
    if (err instanceof AggregateError) {
        return true;
    }
    const record = err;
    return (record.name === 'AggregateError' &&
        Array.isArray(record.errors) &&
        record.errors.length > 0 &&
        typeof record.errors[0] === 'object' &&
        record.errors[0] !== null &&
        'message' in record.errors[0]);
}
export function extractFirstError(err) {
    if (isAggregateError(err)) {
        return err.errors[0];
    }
    return err;
}
//# sourceMappingURL=extractFirstError.js.map