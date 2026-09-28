export class InitError extends Error {
    exitCode;
    name = 'InitError';
    constructor(message, exitCode = 1){
        super(message);
        this.exitCode = exitCode;
    }
}

//# sourceMappingURL=initError.js.map