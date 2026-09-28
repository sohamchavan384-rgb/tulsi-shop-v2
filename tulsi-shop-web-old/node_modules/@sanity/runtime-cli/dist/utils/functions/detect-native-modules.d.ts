import type { Plugin } from 'vite';
export declare const errorMessage: (elements: string[]) => string;
/**
 * Scan the given path. Flag any packages that contain files matching known native module patterns, and return a list of their names.
 */
export declare const detectNativeModules: (nodeModules: string) => string[];
export declare const findPackageDir: (pathName: string) => string | null;
/**
 * A vite plugin that compares resolved deps of a function against known native module patterns, and throws an error if any are found.
 */
export declare const detectNativeModulesPlugin: () => Plugin;
