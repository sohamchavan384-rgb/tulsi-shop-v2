import { transformBlockType } from './blockTypeTransformer.js';
import { transformCrossDatasetReference, transformGlobalDocumentReference, transformReference } from './referenceTransformer.js';
import { getCustomFields, getDefinedTypeName, isCrossDatasetReference, isCustomized, isDefined, isGlobalDocumentReference, isPrimitive, isRecord, isReference } from './schemaTypeHelpers.js';
import { ensureConditional, ensureCustomTitle, ensureString } from './transformerUtils.js';
import { transformValidation } from './validationTransformer.js';
const MAX_CUSTOM_PROPERTY_DEPTH = 5;
/**
 * Transforms a SchemaType to its manifest representation
 */ export function transformType(type, context) {
    const typeName = type.type ? type.type.name : type.jsonType;
    return {
        ...transformCommonTypeFields(type, typeName, context),
        name: type.name,
        type: typeName,
        ...ensureCustomTitle(type.name, type.title)
    };
}
/**
 * Transforms common fields shared across all schema types
 */ function transformCommonTypeFields(type, typeName, context) {
    const arrayProps = typeName === 'array' && type.jsonType === 'array' ? transformArrayMember(type, context) : {};
    const referenceProps = isReference(type) ? transformReference(type, retainCustomTypeProps) : {};
    const crossDatasetRefProps = isCrossDatasetReference(type) ? transformCrossDatasetReference(type) : {};
    const globalRefProps = isGlobalDocumentReference(type) ? transformGlobalDocumentReference(type) : {};
    const objectFields = type.jsonType === 'object' && type.type && isCustomized(type) ? {
        fields: getCustomFields(type).map((objectField)=>transformField(objectField, context))
    } : {};
    return {
        ...retainCustomTypeProps(type),
        ...transformValidation(type.validation, retainSerializableProps),
        ...ensureString('description', type.description),
        ...objectFields,
        ...arrayProps,
        ...referenceProps,
        ...crossDatasetRefProps,
        ...globalRefProps,
        ...ensureConditional('readOnly', type.readOnly),
        ...ensureConditional('hidden', type.hidden),
        ...transformFieldsets(type),
        // fieldset prop gets instrumented via getCustomFields
        ...ensureString('fieldset', type.fieldset),
        ...transformBlockType(type, context, transformType)
    };
}
/**
 * Transforms fieldsets from a schema type
 */ function transformFieldsets(type) {
    if (type.jsonType !== 'object') {
        return {};
    }
    const fieldsets = type.fieldsets?.filter((fs)=>!fs.single).map((fs)=>{
        const options = isRecord(fs.options) ? {
            options: retainSerializableProps(fs.options)
        } : {};
        return {
            name: fs.name,
            ...ensureCustomTitle(fs.name, fs.title),
            ...ensureString('description', fs.description),
            ...ensureConditional('readOnly', fs.readOnly),
            ...ensureConditional('hidden', fs.hidden),
            ...options
        };
    });
    return fieldsets?.length ? {
        fieldsets
    } : {};
}
/**
 * Retains custom type properties that should be included in the manifest
 */ function retainCustomTypeProps(type) {
    const manuallySerializedFields = new Set([
        '__experimental_actions',
        '__experimental_formPreviewTitle',
        '__experimental_omnisearch_visibility',
        '__experimental_search',
        'components',
        'description',
        'fields',
        'fieldsets',
        //only exists on fields
        'group',
        'groups',
        'hidden',
        'icon',
        'jsonType',
        //explicitly added
        'name',
        'of',
        'orderings',
        'preview',
        'readOnly',
        'title',
        'to',
        // not serialized
        'type',
        'validation'
    ]);
    const typeWithoutManuallyHandledFields = Object.fromEntries(Object.entries(type).filter(([key])=>!manuallySerializedFields.has(key)));
    return retainSerializableProps(typeWithoutManuallyHandledFields);
}
/**
 * Retains serializable properties from an unknown value, recursively processing objects and arrays
 * @internal Exported for testing purposes only
 */ export function retainSerializableProps(maybeSerializable, depth = 0) {
    if (depth > MAX_CUSTOM_PROPERTY_DEPTH) {
        return undefined;
    }
    if (!isDefined(maybeSerializable)) {
        return undefined;
    }
    if (isPrimitive(maybeSerializable)) {
        // cull empty strings
        if (maybeSerializable === '') {
            return undefined;
        }
        return maybeSerializable;
    }
    // url-schemes ect..
    if (maybeSerializable instanceof RegExp) {
        return maybeSerializable.toString();
    }
    if (Array.isArray(maybeSerializable)) {
        const arrayItems = maybeSerializable.map((item)=>retainSerializableProps(item, depth + 1)).filter((item)=>isDefined(item));
        return arrayItems.length > 0 ? arrayItems : undefined;
    }
    if (isRecord(maybeSerializable)) {
        const serializableEntries = Object.entries(maybeSerializable).map(([key, value])=>{
            return [
                key,
                retainSerializableProps(value, depth + 1)
            ];
        }).filter(([, value])=>isDefined(value));
        return serializableEntries.length > 0 ? Object.fromEntries(serializableEntries) : undefined;
    }
    return undefined;
}
/**
 * Transforms an ObjectField to its manifest representation
 */ function transformField(field, context) {
    const fieldType = field.type;
    const typeName = getDefinedTypeName(fieldType) ?? fieldType.name;
    return {
        ...transformCommonTypeFields(fieldType, typeName, context),
        name: field.name,
        type: typeName,
        ...ensureCustomTitle(field.name, fieldType.title),
        // this prop gets added synthetically via getCustomFields
        ...ensureString('fieldset', field.fieldset)
    };
}
/**
 * Transforms array member types to their manifest representation
 */ function transformArrayMember(arrayMember, context) {
    return {
        of: arrayMember.of.map((type)=>{
            const typeName = getDefinedTypeName(type) ?? type.name;
            return {
                ...transformCommonTypeFields(type, typeName, context),
                type: typeName,
                ...typeName === type.name ? {} : {
                    name: type.name
                },
                ...ensureCustomTitle(type.name, type.title)
            };
        })
    };
}

//# sourceMappingURL=schemaTypeTransformer.js.map