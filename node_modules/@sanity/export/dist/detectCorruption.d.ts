/**
 * Information about corruption found on a specific line
 * @public
 */
export interface CorruptionInfo {
    /** Line number (1-indexed) */
    line: number;
    /** Column position of first replacement char */
    column: number;
    /** Surrounding text for context */
    context: string;
    /** Number of replacement chars on this line */
    count: number;
}
/**
 * Result of scanning a file for corruption
 * @public
 */
export interface ScanResult {
    /** Whether corruption was detected */
    corrupted: boolean;
    /** Map of filename to corruption info (for tar.gz, multiple files may be scanned) */
    files: Map<string, CorruptionInfo[]>;
    /** Total number of corrupted lines across all files */
    totalCorruptedLines: number;
    /** List of files that were scanned */
    scannedFiles: string[];
}
/**
 * Scans an NDJSON file for UTF-8 corruption
 *
 * @param filePath - Path to the ndjson file
 * @returns Scan result with corruption information
 * @public
 */
export declare function scanNdjsonFile(filePath: string): Promise<ScanResult>;
/**
 * Scans a tar.gz archive for UTF-8 corruption in data.ndjson and asset.json files
 *
 * @param filePath - Path to the tar.gz file
 * @returns Scan result with corruption information
 * @public
 */
export declare function scanTarGz(filePath: string): Promise<ScanResult>;
/**
 * Scans a directory for UTF-8 corruption in data.ndjson and assets.json files
 *
 * @param dirPath - Path to the directory
 * @returns Scan result with corruption information
 * @public
 */
export declare function scanDirectory(dirPath: string): Promise<ScanResult>;
/**
 * Detects UTF-8 corruption in an export file (ndjson, tar.gz, or directory)
 *
 * The corruption manifests as U+FFFD replacement characters appearing
 * where valid multi-byte characters (CJK, emoji, etc.) should be.
 *
 * @param filePath - Path to the file or directory to scan
 * @returns Scan result with corruption information
 * @public
 */
export declare function detectCorruption(filePath: string): Promise<ScanResult>;
//# sourceMappingURL=detectCorruption.d.ts.map