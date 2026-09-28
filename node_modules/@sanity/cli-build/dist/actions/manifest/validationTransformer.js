const transformTypeValidationRule = (rule)=>{
    return {
        ...rule,
        constraint: 'constraint' in rule && (typeof rule.constraint === 'string' ? rule.constraint.toLowerCase() : retainSerializablePropsForValidation(rule.constraint))
    };
};
const validationRuleTransformers = {
    type: transformTypeValidationRule
};
/**
 * Transforms schema validation rules to their manifest representation
 */ export function transformValidation(validation, retainSerializableProps) {
    const validationArray = (Array.isArray(validation) ? validation : [
        validation
    ]).filter((value)=>typeof value === 'object' && '_type' in value);
    // we don't want type in the output as that is implicitly given by the typedef itself an will only bloat the payload
    const disallowedFlags = new Set([
        'type'
    ]);
    const serializedValidation = validationArray.map(({ _level, _message, _rules })=>{
        const message = typeof _message === 'string' ? {
            message: _message
        } : {};
        const serializedRules = _rules.filter((rule)=>{
            if (!('constraint' in rule)) {
                return false;
            }
            const { constraint, flag } = rule;
            if (disallowedFlags.has(flag)) {
                return false;
            }
            // Validation rules that refer to other fields use symbols, which cannot be serialized. It would
            // be possible to transform these to a serializable type, but we haven't implemented that for now.
            const isFieldReference = typeof constraint === 'object' && 'type' in constraint && typeof constraint.type === 'symbol' && (constraint.type.description === 'FIELD_REF' || constraint.type.description === '@sanity/schema/field-ref');
            return !isFieldReference;
        }).map((rule)=>{
            const transformer = validationRuleTransformers[rule.flag] ?? ((spec)=>retainSerializableProps(spec));
            const transformedRule = transformer(rule);
            if (!transformedRule) {
                return;
            }
            return transformedRule;
        }).filter((rule)=>rule !== undefined);
        return {
            level: _level,
            rules: serializedRules,
            ...message
        };
    }).filter((group)=>group.rules.length > 0);
    return serializedValidation.length > 0 ? {
        validation: serializedValidation
    } : {};
}
/**
 * Helper function to retain serializable props specifically for validation transformation.
 * This is used internally by transformTypeValidationRule.
 */ function retainSerializablePropsForValidation(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        if (value === '') {
            return undefined;
        }
        return value;
    }
    if (value instanceof RegExp) {
        return value.toString();
    }
    if (Array.isArray(value)) {
        const items = value.map((item)=>retainSerializablePropsForValidation(item)).filter((item)=>item !== undefined);
        return items.length > 0 ? items : undefined;
    }
    if (typeof value === 'object') {
        const entries = Object.entries(value).map(([key, val])=>[
                key,
                retainSerializablePropsForValidation(val)
            ]).filter(([, val])=>val !== undefined);
        return entries.length > 0 ? Object.fromEntries(entries) : undefined;
    }
    return undefined;
}

//# sourceMappingURL=validationTransformer.js.map