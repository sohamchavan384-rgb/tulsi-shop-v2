export declare const GITIGNORE_FOR_FUNCTIONS = "\n# Sanity Functions\nfunctions/**/.env*\nfunctions/**/.build/\nfunctions/**/node_modules/\n";
export declare const GITIGNORE_TEMPLATE = "node_modules\n.env\n\n# Sanity Functions\nfunctions/**/.env*\nfunctions/**/.build/\nfunctions/**/node_modules/\n\n";
export type GitignoreResult = {
    action: 'created' | 'updated' | 'unchanged';
};
export declare function writeGitignoreFile(nearFilePath: string): GitignoreResult;
