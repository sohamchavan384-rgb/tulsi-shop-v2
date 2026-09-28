const DEFAULT_IMAGE_FIELDS = new Set([
    'asset',
    'crop',
    'hotspot',
    'media'
]);
const DEFAULT_FILE_FIELDS = new Set([
    'asset',
    'media'
]);
const DEFAULT_GEOPOINT_FIELDS = new Set([
    'alt',
    'lat',
    'lng'
]);
const DEFAULT_SLUG_FIELDS = new Set([
    'current',
    'source'
]);
export function getCustomFields(type) {
    const fields = type.fieldsets ? type.fieldsets.flatMap((fs)=>{
        if (fs.single) {
            return fs.field;
        }
        return fs.fields.map((field)=>({
                ...field,
                fieldset: fs.name
            }));
    }) : type.fields;
    if (isType(type, 'block')) {
        return [];
    }
    if (isType(type, 'slug')) {
        return fields.filter((f)=>!DEFAULT_SLUG_FIELDS.has(f.name));
    }
    if (isType(type, 'geopoint')) {
        return fields.filter((f)=>!DEFAULT_GEOPOINT_FIELDS.has(f.name));
    }
    if (isType(type, 'image')) {
        return fields.filter((f)=>!DEFAULT_IMAGE_FIELDS.has(f.name));
    }
    if (isType(type, 'file')) {
        return fields.filter((f)=>!DEFAULT_FILE_FIELDS.has(f.name));
    }
    return fields;
}
export function isReference(type) {
    return isType(type, 'reference');
}
export function isCrossDatasetReference(type) {
    return isType(type, 'crossDatasetReference');
}
export function isGlobalDocumentReference(type) {
    return isType(type, 'globalDocumentReference');
}
function isObjectField(maybeOjectField) {
    return typeof maybeOjectField === 'object' && maybeOjectField !== null && 'name' in maybeOjectField;
}
export function isCustomized(maybeCustomized) {
    const internalOwnProps = getSchemaTypeInternalOwnProps(maybeCustomized);
    const hasFieldsArray = isObjectField(maybeCustomized) && !isReference(maybeCustomized) && !isCrossDatasetReference(maybeCustomized) && !isGlobalDocumentReference(maybeCustomized) && 'fields' in maybeCustomized && Array.isArray(maybeCustomized.fields) && // needed to differentiate inline, named array object types from globally defined types
    // we only consider it customized if the _definition_ has fields declared
    // this holds for all customizable object-like types: object, document, image and file
    internalOwnProps?.fields;
    if (!hasFieldsArray) {
        return false;
    }
    const fields = getCustomFields(maybeCustomized);
    return fields.length > 0;
}
export function isType(schemaType, typeName) {
    if (schemaType.name === typeName) {
        return true;
    }
    if (!schemaType.type) {
        return false;
    }
    return isType(schemaType.type, typeName);
}
export function isDefined(value) {
    return value !== null && value !== undefined;
}
export function isRecord(value) {
    return !!value && typeof value === 'object';
}
export function isPrimitive(value) {
    return isString(value) || isBoolean(value) || isNumber(value);
}
export function isString(value) {
    return typeof value === 'string';
}
function isNumber(value) {
    return typeof value === 'number';
}
function isBoolean(value) {
    return typeof value === 'boolean';
}
/**
 * _internal_ownProps contains the _definition_ for the type.
 * Without it we cannot differentiate inline array item types from globally defined types in array.of
 */ function getSchemaTypeInternalOwnProps(type) {
    return type?._internal_ownProps;
}
/**
 * This allows us to differentiate inline array.of type definitions vs global type names on compiled schema types
 */ export function getDefinedTypeName(type) {
    return getSchemaTypeInternalOwnProps(type)?.type;
}

//# sourceMappingURL=schemaTypeHelpers.js.map