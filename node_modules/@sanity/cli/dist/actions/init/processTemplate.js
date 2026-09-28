/**
 * Process a template string by replacing placeholder variables with actual values.
 *
 * String variables use the format `'%variableName%'` (inside string literals).
 * Boolean variables use the format `__BOOL__variableName__` (as bare identifiers).
 */ export function processTemplate(options) {
    const { includeBooleanTransform = false, template, variables } = options;
    // Replace string placeholders: '%variableName%' or "%variableName%"
    let result = template.trimStart().replaceAll(/(['"])%([\w]+)%\1/g, (_match, quote, variableName)=>{
        if (!(variableName in variables)) {
            throw new Error(`Template variable '%${variableName}%' not defined`);
        }
        const newValue = typeof variables[variableName] === 'string' ? variables[variableName] : '';
        // Escape backslashes first, then the surrounding quote character
        const escaped = newValue.replaceAll('\\', '\\\\').replaceAll(quote, `\\${quote}`);
        return `${quote}${escaped}${quote}`;
    });
    // Replace boolean placeholders: __BOOL__variableName__
    if (includeBooleanTransform) {
        result = result.replaceAll(/__BOOL__(\w+)__/g, (_match, variableName)=>{
            if (!(variableName in variables)) {
                throw new Error(`Template variable '${variableName}' not defined`);
            }
            const value = variables[variableName];
            if (typeof value !== 'boolean') {
                throw new TypeError(`Expected boolean value for '${variableName}'`);
            }
            return String(value);
        });
    }
    return result;
}

//# sourceMappingURL=processTemplate.js.map