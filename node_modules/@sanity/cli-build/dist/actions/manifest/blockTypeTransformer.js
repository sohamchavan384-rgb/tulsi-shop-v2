import { isRecord, isString, isType } from './schemaTypeHelpers.js';
import { ensureString } from './transformerUtils.js';
/**
 * Transforms a block schema type (Portable Text) to its manifest representation
 */ export function transformBlockType(blockType, context, transformType) {
    if (blockType.jsonType !== 'object' || !isType(blockType, 'block')) {
        return {};
    }
    const childrenField = blockType.fields?.find((field)=>field.name === 'children');
    if (!childrenField) {
        return {};
    }
    const ofType = childrenField.type.of;
    if (!ofType) {
        return {};
    }
    const spanType = ofType.find((memberType)=>memberType.name === 'span');
    if (!spanType) {
        return {};
    }
    const inlineObjectTypes = ofType.filter((memberType)=>memberType.name !== 'span') || [];
    return {
        lists: resolveEnabledListItems(blockType),
        marks: {
            annotations: spanType.annotations.map((t)=>transformType(t, context)),
            decorators: resolveEnabledDecorators(spanType)
        },
        of: inlineObjectTypes.map((t)=>transformType(t, context)),
        styles: resolveEnabledStyles(blockType)
    };
}
/**
 * Resolves enabled styles from a block type
 */ function resolveEnabledStyles(blockType) {
    const styleField = blockType.fields?.find((btField)=>btField.name === 'style');
    return resolveTitleValueArray(styleField?.type?.options?.list);
}
/**
 * Resolves enabled decorators from a span type
 */ function resolveEnabledDecorators(spanType) {
    return 'decorators' in spanType ? resolveTitleValueArray(spanType.decorators) : undefined;
}
/**
 * Resolves enabled list items from a block type
 */ function resolveEnabledListItems(blockType) {
    const listField = blockType.fields?.find((btField)=>btField.name === 'listItem');
    return resolveTitleValueArray(listField?.type?.options?.list);
}
/**
 * Resolves an array of title/value objects
 */ function resolveTitleValueArray(possibleArray) {
    if (!possibleArray || !Array.isArray(possibleArray)) {
        return undefined;
    }
    const titledValues = possibleArray.filter((d)=>isRecord(d) && !!d.value && isString(d.value)).map((item)=>{
        return {
            value: item.value,
            ...ensureString('title', item.title)
        };
    });
    if (!titledValues?.length) {
        return undefined;
    }
    return titledValues;
}

//# sourceMappingURL=blockTypeTransformer.js.map