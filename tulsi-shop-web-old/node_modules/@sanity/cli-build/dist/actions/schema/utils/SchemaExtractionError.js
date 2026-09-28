export class SchemaExtractionError extends Error {
    validation;
    constructor(message, validation){
        super(message);
        this.name = 'SchemaExtractionError';
        this.validation = validation;
    }
}

//# sourceMappingURL=SchemaExtractionError.js.map