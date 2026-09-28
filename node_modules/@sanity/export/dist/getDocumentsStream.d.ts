import type { ExportSource, NormalizedExportOptions, ResponseStream } from './types.js';
type GetDocumentStreamOptions = Partial<NormalizedExportOptions> & Pick<NormalizedExportOptions, 'client' | 'types' | 'maxRetries' | 'retryDelayMs' | 'readTimeout'> & ExportSource;
export declare function getDocumentsStream(options: GetDocumentStreamOptions): Promise<ResponseStream>;
export {};
//# sourceMappingURL=getDocumentsStream.d.ts.map