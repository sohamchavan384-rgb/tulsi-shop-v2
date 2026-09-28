function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
export function getValueType(value) {
    if (Array.isArray(value)) {
        return 'array';
    }
    return value === null ? 'null' : typeof value === "undefined" ? "undefined" : _type_of(value);
}
