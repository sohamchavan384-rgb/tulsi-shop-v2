import { isNonUnion, isUnion } from '../helpers.js';
import { createBooleanFilters } from './filters/booleanFilters.js';
import { createDateFilters } from './filters/dateFilters.js';
import { createDateTimeFilters } from './filters/dateTimeFilters.js';
import { createDocumentFilters } from './filters/documentFilters.js';
import { createFloatFilters } from './filters/floatFilters.js';
import { createIdFilters } from './filters/idFilters.js';
import { createIntegerFilters } from './filters/integerFilters.js';
import { createStringFilters } from './filters/stringFilters.js';
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
export function generateTypeFilters(types) {
    const builtInTypeKeys = Object.keys(filterCreators);
    const builtinTypeValues = Object.values(filterCreators);
    const objectTypes = types.filter((type)=>isNonUnion(type)).filter((type)=>type.type === 'Object' && ![
            'Block',
            'Span'
        ].includes(type.name) && !type.interfaces && !builtInTypeKeys.includes(type.type));
    const unionTypes = types.filter((type)=>isUnion(type)).map((type)=>type.name);
    const documentTypes = types.filter((type)=>isNonUnion(type)).filter((type)=>type.type === 'Object' && type.interfaces && type.interfaces.includes('Document'));
    const builtinTypeFilters = createBuiltinTypeFilters(builtinTypeValues);
    const objectTypeFilters = createObjectTypeFilters(objectTypes, {
        unionTypes
    });
    const documentTypeFilters = createDocumentTypeFilters(documentTypes, {
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
            name: `${objectType.name}Filter`
        }));
}
function createDocumentTypeFilters(documentTypes, options) {
    return documentTypes.map((documentType)=>({
            fields: [
                ...getDocumentFilters(),
                ...createFieldFilters(documentType, options)
            ],
            kind: 'InputObject',
            name: `${documentType.name}Filter`
        }));
}
function createFieldFilters(objectType, options) {
    const { unionTypes } = options;
    return objectType.fields.filter((field)=>field.type !== 'JSON' && field.kind !== 'List' && !unionTypes.includes(field.type)).map((field)=>({
            fieldName: field.fieldName,
            isReference: field.isReference,
            type: `${typeAliases[field.type] || field.type}Filter`
        }));
}
function getDocumentFilters() {
    return [
        {
            description: 'Apply filters on document level',
            fieldName: '_',
            type: 'DocumentFilter'
        }
    ];
}

//# sourceMappingURL=generateTypeFilters.js.map