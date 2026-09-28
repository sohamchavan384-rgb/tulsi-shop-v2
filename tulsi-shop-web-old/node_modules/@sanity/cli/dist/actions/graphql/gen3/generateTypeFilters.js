import { createBooleanFilters } from '../gen2/filters/booleanFilters.js';
import { createDateFilters } from '../gen2/filters/dateFilters.js';
import { createDateTimeFilters } from '../gen2/filters/dateTimeFilters.js';
import { createFloatFilters } from '../gen2/filters/floatFilters.js';
import { createIdFilters } from '../gen2/filters/idFilters.js';
import { createIntegerFilters } from '../gen2/filters/integerFilters.js';
import { createStringFilters } from '../gen2/filters/stringFilters.js';
import { isDocumentType, isNonUnion, isUnion } from '../helpers.js';
import { createDocumentFilters } from './filters/documentFilters.js';
import { getFilterFieldName } from './utils.js';
const typeAliases = {
    Email: 'String',
    Text: 'String',
    Url: 'String'
};
const filterCreators = {
    Boolean: createBooleanFilters,
    Date: createDateFilters,
    Datetime: createDateTimeFilters,
    Document: createDocumentFilters,
    Float: createFloatFilters,
    ID: createIdFilters,
    Integer: createIntegerFilters,
    String: createStringFilters
};
export function generateTypeFilters(types, options) {
    const { filterSuffix } = options || {};
    const builtInTypeKeys = Object.keys(filterCreators);
    const builtinTypeValues = Object.values(filterCreators);
    const objectTypes = types.filter((type)=>isNonUnion(type)).filter((type)=>type.type === 'Object' && ![
            'Block',
            'Span'
        ].includes(type.name) && // TODO: What do we do with blocks?
        !type.interfaces && !builtInTypeKeys.includes(type.type));
    const unionTypes = types.filter((type)=>isUnion(type)).map((type)=>type.name);
    const documentTypes = types.filter((type)=>type.name === 'Document' || isDocumentType(type));
    const builtinTypeFilters = createBuiltinTypeFilters(builtinTypeValues);
    const objectTypeFilters = createObjectTypeFilters(objectTypes, {
        filterSuffix,
        unionTypes
    });
    const documentTypeFilters = createDocumentTypeFilters(documentTypes, {
        filterSuffix,
        unionTypes
    });
    return [
        ...builtinTypeFilters,
        ...objectTypeFilters,
        ...documentTypeFilters
    ];
}
function createBuiltinTypeFilters(builtinTypeValues) {
    return builtinTypeValues.map((filterCreator)=>filterCreator());
}
function createObjectTypeFilters(objectTypes, options) {
    return objectTypes.map((objectType)=>({
            fields: createFieldFilters(objectType, options),
            kind: 'InputObject',
            name: getFilterFieldName(objectType.name, options.filterSuffix)
        }));
}
function createDocumentTypeFilters(documentTypes, options) {
    return documentTypes.map((documentType)=>({
            fields: [
                ...getDocumentFilters(),
                ...createFieldFilters(documentType, options)
            ],
            kind: 'InputObject',
            name: getFilterFieldName(documentType.name, options.filterSuffix)
        }));
}
function createFieldFilters(objectType, options) {
    const { unionTypes } = options;
    if (!objectType.fields) {
        return [];
    }
    return objectType.fields.filter((field)=>field.type !== 'JSON' && field.kind !== 'List' && !unionTypes.includes(field.type)).map((field)=>{
        const typeName = typeAliases[field.type] || field.type;
        // If the type is default type than don't add a custom suffix
        const filterSuffix = Object.keys({
            ...typeAliases,
            ...filterCreators
        }).includes(typeName) ? undefined : options.filterSuffix;
        return {
            fieldName: field.fieldName,
            isReference: field.isReference,
            type: getFilterFieldName(typeAliases[field.type] || field.type, filterSuffix)
        };
    });
}
function getDocumentFilters() {
    return [
        {
            description: 'Apply filters on document level',
            fieldName: '_',
            type: 'Sanity_DocumentFilter'
        }
    ];
}

//# sourceMappingURL=generateTypeFilters.js.map