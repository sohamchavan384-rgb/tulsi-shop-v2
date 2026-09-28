import type { ExportOptions, ExportSource, NormalizedExportOptions } from './types.js';
export declare function validateOptions(opts: ExportOptions): NormalizedExportOptions;
/**
 * Determines the source type and ID from the provided options.
 *
 * @param options - The export options containing either dataset or mediaLibraryId.
 * @returns An object with the source type and its corresponding ID.
 * @internal
 */
export declare function getSource(options: ExportSource): {
    type: 'dataset' | 'media-library';
    id: string;
};
//# sourceMappingURL=options.d.ts.map