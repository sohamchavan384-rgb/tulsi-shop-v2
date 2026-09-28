/**
 * Walks up the directory tree from a starting point to find a given file/directory.
 *
 * @param fileName - The name of the file/directory to find.
 * @param startDir - The directory to start searching from (default is the current working directory).
 * @returns The path to the file if found, otherwise undefined.
 */
export declare function findUp(fileName: string, startDir?: string): Promise<string | undefined>;
/**
 * Finds the directory containing a specific file/directory by walking up the directory tree.
 *
 * @param fileName - The name of the file/directory to find.
 * @param startDir - The directory to start searching from (default is the current working directory).
 * @returns The directory containing the file if found, otherwise undefined.
 */
export declare function findDirUp(fileName: string, startDir?: string): Promise<string | undefined>;
