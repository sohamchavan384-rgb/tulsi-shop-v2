interface CopyTool {
    cmd: string;
    args: string[];
}
export declare class ClipboardUnavailableError extends Error {
    code: string;
    triedTools: string[];
    constructor(message: string, triedTools?: string[]);
}
/** Candidate copy tools for the current OS, in fallback order. */
export declare function pickCopyTools(): CopyTool[];
/** @throws {ClipboardUnavailableError} when no usable clipboard tool is available. */
export declare function write(text: string): Promise<void>;
export {};
