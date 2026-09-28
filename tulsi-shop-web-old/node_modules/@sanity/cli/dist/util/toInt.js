export function toInt(value, defaultValue) {
    if (value === undefined) {
        return defaultValue;
    }
    const intVal = Number.parseInt(`${value}`, 10);
    return Number.isFinite(intVal) ? intVal : defaultValue;
}

//# sourceMappingURL=toInt.js.map