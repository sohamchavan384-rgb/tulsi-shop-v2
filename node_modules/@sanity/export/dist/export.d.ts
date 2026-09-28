import { type Writable } from 'node:stream';
import type { ExportOptions, ExportResult } from './types.js';
/**
 * Export the dataset with the given options.
 *
 * @param opts - Export options
 * @returns The export result
 * @public
 */
export declare function exportDataset(opts: ExportOptions & {
    outputPath: Writable;
}): Promise<ExportResult<Writable>>;
export declare function exportDataset(opts: ExportOptions & {
    outputPath: string;
}): Promise<ExportResult<string>>;
export declare function exportDataset(opts: ExportOptions): Promise<ExportResult>;
type MediaLibraryExportOptions = Omit<ExportOptions, 'dataset' | 'mediaLibraryId'> & {
    mediaLibraryId: string;
};
/**
 * Export the media library with the given `mediaLibraryId`.
 *
 * @param options - Export options
 * @returns The export result
 * @public
 */
export declare function exportMediaLibrary(options: MediaLibraryExportOptions & {
    outputPath: Writable;
}): Promise<ExportResult<Writable>>;
export declare function exportMediaLibrary(options: MediaLibraryExportOptions & {
    outputPath: string;
}): Promise<ExportResult<string>>;
export declare function exportMediaLibrary(options: MediaLibraryExportOptions): Promise<ExportResult>;
/**
 * Alias for `exportDataset`, for backwards compatibility.
 * Use named `exportDataset` instead.
 *
 * @deprecated Default export is deprecated and will be removed in a future release. Use named "exportDataset" function instead.
 * @public
 */
declare const _default: (opts: ExportOptions) => Promise<ExportResult>;
export default _default;
//# sourceMappingURL=export.d.ts.map