/* eslint-disable unicorn/consistent-function-scoping */ import { generateHelpUrl } from '@sanity/generate-help-url';
import { Schema } from '@sanity/schema';
import { isDeprecationConfiguration } from '@sanity/types';
import startCase from 'lodash-es/startCase.js';
import uniqBy from 'lodash-es/uniqBy.js';
import { oneline } from 'oneline';
import { SCHEMA_LIFT_ANONYMOUS_OBJECT_TYPE } from './helpUrls.js';
import { SchemaError } from './SchemaError.js';
const skipTypes = new Set([
    'document',
    'reference'
]);
const allowedJsonTypes = new Set([
    'array',
    'object'
]);
const disallowedCustomizedMembers = new Set([
    'array',
    'block',
    'file',
    'image',
    'object'
]);
const disabledBlockFields = new Set([
    'markDefs'
]);
const scalars = new Set([
    'boolean',
    'number',
    'string'
]);
function getBaseType(baseSchema, typeName) {
    if (typeName === 'crossDatasetReference') {
        return Schema.compile({
            parent: baseSchema,
            types: [
                {
                    name: `__placeholder__`,
                    // Just needs _something_ to refer to, doesn't matter what
                    to: [
                        {
                            type: 'sanity.imageAsset'
                        }
                    ],
                    type: 'crossDatasetReference'
                }
            ]
        }).get('__placeholder__');
    }
    if (typeName === 'globalDocumentReference') {
        return Schema.compile({
            parent: baseSchema,
            types: [
                {
                    name: `__placeholder__`,
                    // Just needs _something_ to refer to, doesn't matter what
                    to: [
                        {
                            type: 'sanity.imageAsset'
                        }
                    ],
                    type: 'globalDocumentReference'
                }
            ]
        }).get('__placeholder__');
    }
    return Schema.compile({
        parent: baseSchema,
        types: [
            {
                name: `__placeholder__`,
                options: {
                    hotspot: true
                },
                type: typeName
            }
        ]
    }).get('__placeholder__');
}
function getTypeName(str) {
    const name = startCase(str).replaceAll(/\s+/g, '');
    return name === 'Number' ? 'Float' : name;
}
function isBaseType(type) {
    return type.name !== type.jsonType && allowedJsonTypes.has(type.jsonType) && !skipTypes.has(type.name) && !isReference(type);
}
function isBlockType(typeDef) {
    if (typeDef.name === 'block') {
        return true;
    }
    if (typeDef.type) {
        return isBlockType(typeDef.type);
    }
    return false;
}
function hasBlockParent(typeDef) {
    if (typeDef.type && typeDef.type.name === 'block' && !typeDef.type.type) {
        return true;
    }
    return Boolean(typeDef.type && hasBlockParent(typeDef.type));
}
function isArrayOfBlocks(typeDef) {
    const type = typeDef.type || typeDef;
    if (!('jsonType' in type) || type.jsonType !== 'array') {
        return false;
    }
    return (type.of || []).some((item)=>hasBlockParent(item));
}
function isType(typeDef, typeName) {
    let type = typeDef;
    while(type){
        if (type.name === typeName || type.type && type.type.name === typeName) {
            return true;
        }
        type = type.type;
    }
    return false;
}
function isReference(typeDef) {
    return isType(typeDef, 'reference');
}
function isCrossDatasetReference(typeDef) {
    return isType(typeDef, 'crossDatasetReference');
}
function getCrossDatasetReferenceMetadata(typeDef) {
    if (!isCrossDatasetReference(typeDef)) return;
    function getTypeNames(type) {
        if (!type) return;
        if (!('to' in type)) return getTypeNames(type.type);
        return type.to.map((t)=>t.type).filter((t)=>typeof t === 'string');
    }
    function getDataset(type) {
        if (!type) return;
        if ('dataset' in type && typeof type.dataset === 'string') return type.dataset;
        if (type.type) return getDataset(type.type);
    }
    const typeNames = getTypeNames(typeDef);
    if (!typeNames) return;
    const dataset = getDataset(typeDef);
    if (typeof dataset !== 'string') return;
    return {
        dataset,
        typeNames
    };
}
export function extractFromSanitySchema(sanitySchema, extractOptions = {}) {
    const { nonNullDocumentFields, withUnionCache } = extractOptions;
    const unionRecursionGuards = new Set();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unionDefinitionCache = new Map();
    const hasErrors = sanitySchema._validation && sanitySchema._validation.some((group)=>group.problems.some((problem)=>problem.severity === 'error'));
    if (hasErrors && Array.isArray(sanitySchema._validation)) {
        throw new SchemaError(sanitySchema._validation);
    }
    const sanityTypes = sanitySchema._original?.types || [];
    const typeNames = sanitySchema.getTypeNames();
    const unionTypes = [];
    const types = [];
    for (const typeName of typeNames){
        const schemaType = sanitySchema.get(typeName);
        if (schemaType === undefined) {
            continue;
        }
        if (!isBaseType(schemaType)) {
            continue;
        }
        const convertedType = convertType(schemaType);
        types.push(convertedType);
    }
    const withUnions = [
        ...types,
        ...unionTypes
    ];
    return {
        interfaces: [
            getDocumentInterfaceDefinition()
        ],
        types: withUnions
    };
    function isTopLevelType(typeName) {
        return typeNames.includes(typeName);
    }
    function mapFieldType(field) {
        if (!field.type) {
            throw new Error('Field has no type!');
        }
        const jsonType = 'jsonType' in field ? field.jsonType : '';
        const isScalar = scalars.has(jsonType);
        if (isScalar && jsonType === 'number') {
            return hasValidationFlag(field, 'integer') ? 'Int' : 'Float';
        } else if (isScalar) {
            return getTypeName(jsonType);
        }
        const type = field.type.type || field.type;
        // In the case of nested scalars, recurse (markdown -> longText -> text -> string)
        if (type.type) {
            return mapFieldType(type);
        }
        switch(type.name){
            case 'number':
                {
                    return hasValidationFlag(field, 'integer') ? 'Int' : 'Float';
                }
            default:
                {
                    return getTypeName(type.name);
                }
        }
    }
    function isArrayType(type) {
        return Boolean('jsonType' in type && type.jsonType === 'array' || type.type && type.type.jsonType === 'array');
    }
    function _convertType(type, parent, options) {
        let name;
        if (type.type) {
            name = type.type.name;
        } else if ('jsonType' in type) {
            name = type.jsonType;
        }
        if (isReference(type)) {
            return getReferenceDefinition(type);
        }
        if (isArrayType(type)) {
            return getArrayDefinition(type, parent, options);
        }
        if (name === 'document') {
            return getDocumentDefinition(type);
        }
        if (name === 'block' || name === 'object') {
            return getObjectDefinition(type, parent);
        }
        if (hasFields(type)) {
            return getObjectDefinition(type, parent);
        }
        return {
            description: getDescription(type),
            type: mapFieldType(type)
        };
    }
    function convertType(type, parent, props = {}) {
        const mapped = _convertType(type, parent || '', {
            isField: Boolean(props.fieldName)
        });
        const gqlName = props.fieldName || mapped.name;
        const originalName = type.name;
        const original = gqlName === originalName ? {} : {
            originalName: originalName
        };
        const crossDatasetReferenceMetadata = getCrossDatasetReferenceMetadata(type);
        return {
            ...getDeprecation(type.type),
            ...props,
            ...mapped,
            ...original,
            ...crossDatasetReferenceMetadata && {
                crossDatasetReferenceMetadata
            }
        };
    }
    function isField(def) {
        return !('jsonType' in def) || !def.jsonType;
    }
    function getObjectDefinition(def, parent) {
        const isInline = isField(def);
        const isDocument = def.type ? def.type.name === 'document' : false;
        const actualType = isInline ? def.type : def;
        if (typeNeedsHoisting(actualType)) {
            throw createLiftTypeError(def.name, parent || '', actualType.name);
        }
        if (isInline && parent && def.type.name === 'object') {
            throw createLiftTypeError(def.name, parent);
        }
        if (parent && def.type && isTopLevelType(def.type.name)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return {
                type: getTypeName(def.type.name)
            };
        }
        const name = `${parent || ''}${getTypeName(def.name)}`;
        const fields = collectFields(def);
        const firstUnprefixed = Math.max(0, fields.findIndex((field)=>field.name[0] !== '_'));
        const keyField = createStringField('_key');
        fields.splice(firstUnprefixed, 0, keyField);
        if (!isDocument) {
            fields.splice(firstUnprefixed + 1, 0, createStringField('_type'));
        }
        const objectIsBlock = isBlockType(def);
        const objectFields = objectIsBlock ? fields.filter((field)=>!disabledBlockFields.has(field.name)) : fields;
        return {
            _internal: {
                ...getDeprecation(def)
            },
            description: getDescription(def),
            fields: objectFields.map((field)=>isArrayOfBlocks(field) ? buildRawField(field, name) : convertType(field, name, {
                    fieldName: field.name,
                    ...getDeprecation(def)
                })),
            kind: 'Type',
            name,
            type: 'Object'
        };
    }
    function buildRawField(field, parentName) {
        return {
            ...convertType(field, parentName, {
                fieldName: `${field.name}Raw`
            }),
            isRawAlias: true,
            type: 'JSON'
        };
    }
    function createStringField(name) {
        return {
            name,
            type: {
                jsonType: 'string',
                name: 'string',
                type: {
                    jsonType: 'string',
                    name: 'string',
                    type: undefined
                }
            }
        };
    }
    function collectFields(def) {
        const fields = gatherAllFields(def);
        if (fields.length > 0) {
            return fields;
        }
        const extended = getBaseType(sanitySchema, def.name);
        return gatherAllFields(extended);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getReferenceDefinition(def) {
        const base = {
            description: getDescription(def),
            isReference: true
        };
        const candidates = arrayify(gatherAllReferenceCandidates(def));
        if (candidates.length === 0) {
            throw new Error('No candidates for reference');
        }
        if (candidates.length === 1) {
            return {
                type: getTypeName(candidates[0].type.name),
                ...base
            };
        }
        const allTypeNames = candidates.map((c)=>getTypeName(c.type.name));
        const targetTypes = [
            ...new Set(allTypeNames)
        ].toSorted();
        const name = targetTypes.join('Or');
        // Register the union type if we haven't seen it before
        if (!unionTypes.some((item)=>item.name === name)) {
            unionTypes.push({
                kind: 'Union',
                name,
                types: targetTypes
            });
        }
        return {
            type: name,
            ...base
        };
    }
    function getArrayDefinition(def, parent, options = {}) {
        const base = {
            description: getDescription(def),
            kind: 'List'
        };
        const name = !options.isField && def.name ? {
            name: getTypeName(def.name)
        } : {};
        const candidates = def.type?.type && 'of' in def.type ? arrayify(def.type.of) : def.of;
        return candidates.length === 1 ? {
            children: getArrayChildDefinition(candidates[0], def),
            ...base,
            ...name
        } : {
            children: getUnionDefinition(candidates, def, {
                grandParent: parent
            }),
            ...base,
            ...name
        };
    }
    function getArrayChildDefinition(child, arrayDef) {
        if (typeNeedsHoisting(child)) {
            // Seems to be inline? Should be hoisted?
            throw createLiftTypeError(child.name, arrayDef.name);
        }
        if (isReference(child)) {
            return getReferenceDefinition(child);
        }
        // In the case of nested scalars, recurse (markdown -> longText -> text -> string)
        if (scalars.has(child.jsonType) && !scalars.has(child.name)) {
            return {
                type: mapFieldType(child)
            };
        }
        return {
            type: getTypeName(child.name)
        };
    }
    function typeNeedsHoisting(type) {
        if (type.name === 'object') {
            return true;
        }
        if (type.jsonType === 'object' && !isTopLevelType(type.name)) {
            return true;
        }
        if (type.isCustomized && !isTopLevelType(type.name)) {
            return true;
        }
        if (type.isCustomized && disallowedCustomizedMembers.has(type.name)) {
            return true;
        }
        return false;
    }
    function getUnionDefinition(candidates, parent, options = {}) {
        if (candidates.length < 2) {
            throw new Error('Not enough candidates for a union type');
        }
        // #1482: When creating union definition do not get caught in recursion loop
        // for types that reference themselves
        const guardPathName = `${typeof parent === 'object' ? parent.name : parent}`;
        if (unionRecursionGuards.has(guardPathName)) {
            return {};
        }
        const unionCacheKey = `${options.grandParent}-${guardPathName}-${candidates.map((c)=>c.type?.name).join('-')}`;
        if (withUnionCache && unionDefinitionCache.has(unionCacheKey)) {
            return unionDefinitionCache.get(unionCacheKey);
        }
        try {
            unionRecursionGuards.add(guardPathName);
            for (const [i, def] of candidates.entries()){
                if (typeNeedsHoisting(def)) {
                    throw createLiftTypeArrayError(i, parent.name, def.type ? def.type.name : def.name, options.grandParent);
                }
            }
            const converted = candidates.map((def)=>convertType(def));
            const getName = (def)=>typeof def.type === 'string' ? def.type : def.type.name;
            // We might end up with union types being returned - these needs to be flattened
            // so that an ImageOr(PersonOrPet) becomes ImageOrPersonOrPet
            // eslint-disable-next-line unicorn/no-array-reduce
            const flattened = converted.reduce((acc, candidate)=>{
                const union = unionTypes.find((item)=>item.name === candidate.type);
                return union ? acc.concat(union.types.map((type)=>({
                        isReference: candidate.isReference,
                        type
                    }))) : [
                    ...acc,
                    candidate
                ];
            }, []);
            let allCandidatesAreDocuments = true;
            const refs = [];
            const inlineObjs = [];
            const allTypeNames = [];
            for (const def of flattened){
                if (def.isReference) {
                    refs.push(def.type);
                }
                if (!isReference) {
                    inlineObjs.push(def.name || '');
                }
                const typeName = typeof def.type === 'string' ? def.type : def.type.name;
                // Here we remove duplicates, as they might appear twice due to in-line usage of types as well as references
                if (def.name || def.type) {
                    allTypeNames.push(def.isReference ? typeName : def.name || '');
                }
                const typeDef = sanityTypes.find((type)=>type.name === getName(def));
                if (!typeDef || typeDef.type !== 'document') {
                    allCandidatesAreDocuments = false;
                }
            }
            const interfaces = allCandidatesAreDocuments ? [
                'Document'
            ] : undefined;
            const possibleTypes = [
                ...new Set(allTypeNames)
            ].toSorted();
            if (possibleTypes.length < 2) {
                throw new Error(`Not enough types for a union type. Parent: ${parent.name}`);
            }
            const name = possibleTypes.join('Or');
            if (!unionTypes.some((item)=>item.name === name)) {
                unionTypes.push({
                    interfaces,
                    kind: 'Union',
                    name,
                    types: possibleTypes
                });
            }
            const references = refs.length > 0 ? refs : undefined;
            const inlineObjects = inlineObjs.length > 0 ? inlineObjs : undefined;
            const unionDefinition = isReference(parent) ? {
                references,
                type: name
            } : {
                inlineObjects,
                references,
                type: name
            };
            unionDefinitionCache.set(unionCacheKey, unionDefinition);
            return unionDefinition;
        } finally{
            unionRecursionGuards.delete(guardPathName);
        }
    }
    function getDocumentDefinition(def) {
        const objectDef = getObjectDefinition(def);
        const fields = [
            ...getDocumentInterfaceFields(def),
            ...objectDef.fields
        ];
        return {
            ...objectDef,
            fields,
            interfaces: [
                'Document'
            ]
        };
    }
    function getDocumentInterfaceDefinition() {
        return {
            description: 'A Sanity document',
            fields: getDocumentInterfaceFields(),
            kind: 'Interface',
            name: 'Document'
        };
    }
    function getDocumentInterfaceFields(type) {
        const isNullable = typeof nonNullDocumentFields === 'boolean' ? !nonNullDocumentFields : true;
        return [
            {
                description: 'Document ID',
                fieldName: '_id',
                isNullable,
                type: 'ID',
                ...getDeprecation(type)
            },
            {
                description: 'Document type',
                fieldName: '_type',
                isNullable,
                type: 'String',
                ...getDeprecation(type)
            },
            {
                description: 'Date the document was created',
                fieldName: '_createdAt',
                isNullable,
                type: 'Datetime',
                ...getDeprecation(type)
            },
            {
                description: 'Date the document was last modified',
                fieldName: '_updatedAt',
                isNullable,
                type: 'Datetime',
                ...getDeprecation(type)
            },
            {
                description: 'Current document revision',
                fieldName: '_rev',
                isNullable,
                type: 'String',
                ...getDeprecation(type)
            }
        ];
    }
    function arrayify(thing) {
        if (Array.isArray(thing)) {
            return thing;
        }
        return thing === null || thing === undefined ? [] : [
            thing
        ];
    }
    function hasValidationFlag(field, flag) {
        return 'validation' in field && Array.isArray(field.validation) && field.validation.some((rule)=>rule && '_rules' in rule && rule._rules.some((item)=>item.flag === flag));
    }
    function getDescription(type) {
        const description = type.type && type.type.description;
        return typeof description === 'string' ? description : undefined;
    }
    function gatherAllReferenceCandidates(type) {
        const allFields = gatherReferenceCandidates(type);
        return uniqBy(allFields, 'name');
    }
    function gatherReferenceCandidates(type) {
        const refTo = 'to' in type ? type.to : [];
        return 'type' in type && type.type ? [
            ...gatherReferenceCandidates(type.type),
            ...refTo
        ] : refTo;
    }
    function gatherAllFields(type) {
        const allFields = gatherFields(type);
        return uniqBy(allFields, 'name');
    }
    function gatherFields(type) {
        if ('fields' in type) {
            return type.type ? [
                ...gatherFields(type.type),
                ...type.fields
            ] : type.fields;
        }
        return [];
    }
    function hasFieldsLikeShape(type) {
        return typeof type === 'object' && type !== null && 'fields' in type;
    }
    function hasArrayOfFields(type) {
        return hasFieldsLikeShape(type) && Array.isArray(type.fields);
    }
    function hasFields(type) {
        if (hasArrayOfFields(type)) {
            return gatherAllFields(type).length > 0;
        }
        return 'type' in type && type.type ? hasFields(type.type) : false;
    }
}
function createLiftTypeArrayError(index, parent, inlineType = 'object', grandParent = '') {
    const helpUrl = generateHelpUrl(SCHEMA_LIFT_ANONYMOUS_OBJECT_TYPE);
    const context = [
        grandParent,
        parent
    ].filter(Boolean).join('/');
    return new HelpfulError(oneline`
    Encountered anonymous inline ${inlineType} at index ${index} for type/field ${context}.
    To use this type with GraphQL you will need to create a top-level schema type for it.
    See ${helpUrl}`, helpUrl);
}
function createLiftTypeError(typeName, parent, inlineType = 'object') {
    const helpUrl = generateHelpUrl(SCHEMA_LIFT_ANONYMOUS_OBJECT_TYPE);
    return new HelpfulError(oneline`
    Encountered anonymous inline ${inlineType} "${typeName}" for field/type "${parent}".
    To use this field with GraphQL you will need to create a top-level schema type for it.
    See ${helpUrl}`, helpUrl);
}
class HelpfulError extends Error {
    helpUrl;
    constructor(message, helpUrl){
        super(message);
        this.name = 'HelpfulError';
        this.helpUrl = helpUrl;
    }
}
function getDeprecation(type) {
    return isDeprecationConfiguration(type) ? {
        deprecationReason: type.deprecated.reason
    } : {};
}

//# sourceMappingURL=extractFromSanitySchema.js.map