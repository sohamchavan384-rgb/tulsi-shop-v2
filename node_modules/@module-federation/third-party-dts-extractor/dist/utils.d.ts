declare function getTypedName(name: string): string;
/**
 * Locates the directory of the package.json for the given packageName.
 * 1. Resolves the entry file via require.resolve().
 * 2. Looks for package.json in that same directory (fallback).
 * 3. Climb upward until the folder name matches localName
 *    (the part after a scope slash, e.g. "@scope/sdk" => "sdk").
 * 4. If that folder's package.json has "name" === packageName, return that directory.
 * 5. Otherwise, return the fallback directory (if it contains a package.json).
 * 6. If all else fails, throw an error.
 */
declare function getPackageRootDir(packageName: string | undefined, context?: string): string;
declare function resolvePackageJson(packageName: string, context: string): string;
export { getTypedName, getPackageRootDir, resolvePackageJson };
