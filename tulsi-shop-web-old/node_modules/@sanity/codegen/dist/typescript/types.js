const isRecord = (value)=>(typeof value === 'object' || typeof value === 'function') && !!value;
/**
 * An error that occurred during query extraction.
 * @public
 */ export class QueryExtractionError extends Error {
    filename;
    variable;
    constructor({ cause, filename, variable }){
        super(`Error while extracting query ${variable ? `from variable '${variable.id.name}' ` : ''}in ${filename}: ${isRecord(cause) && typeof cause.message === 'string' ? cause.message : 'Unknown error'}`);
        this.name = 'QueryExtractionError';
        this.cause = cause;
        this.variable = variable;
        this.filename = filename;
    }
}
/**
 * An error that occurred during query evaluation.
 * @public
 */ export class QueryEvaluationError extends Error {
    filename;
    variable;
    constructor({ cause, filename, variable }){
        super(`Error while evaluating query ${variable ? `from variable '${variable.id.name}' ` : ''}in ${filename}: ${isRecord(cause) && typeof cause.message === 'string' ? cause.message : 'Unknown error'}`);
        this.name = 'QueryEvaluationError';
        this.cause = cause;
        this.variable = variable;
        this.filename = filename;
    }
}

//# sourceMappingURL=types.js.map