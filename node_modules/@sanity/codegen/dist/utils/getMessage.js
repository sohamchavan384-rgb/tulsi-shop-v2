export const getMessage = (error)=>typeof error === 'object' && !!error && 'message' in error && typeof error.message === 'string' ? error.message : 'Unknown error';

//# sourceMappingURL=getMessage.js.map