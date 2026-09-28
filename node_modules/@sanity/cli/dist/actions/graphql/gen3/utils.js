/**
 * Generates a filter field name for a given field name.
 *
 * @internal
 *
 * @param fieldName - The field name to generate a filter field name for.
 * @param suffix - The suffix to append to the field name. Default is `Filter`.
 */ export function getFilterFieldName(fieldName, suffix = 'Filter') {
    return `${fieldName}${suffix}`;
}

//# sourceMappingURL=utils.js.map