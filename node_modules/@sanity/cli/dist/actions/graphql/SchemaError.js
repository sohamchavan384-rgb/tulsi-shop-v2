import { formatSchemaValidation } from '@sanity/cli-build/_internal/extract';
export class SchemaError extends Error {
    problemGroups;
    constructor(problemGroups){
        super('Schema errors encountered');
        this.name = 'SchemaError';
        this.problemGroups = problemGroups;
    }
    print(output, label) {
        output.warn(`${label ?? 'Found errors in schema'}:\n`);
        output.log(formatSchemaValidation(this.problemGroups));
    }
}

//# sourceMappingURL=SchemaError.js.map