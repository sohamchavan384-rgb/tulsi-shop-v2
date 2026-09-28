import { type ClientConfig } from '@sanity/client';
import type { Logger } from '../logger.js';
import type { FetchConfig } from '../types.js';
export declare function fetchDocument(documentId: string, { projectId, dataset, useCdn, apiVersion, apiHost, token }: ClientConfig, logger: Logger): Promise<Record<string, unknown>>;
export declare function fetchAsset(documentId: string, { mediaLibraryId, apiVersion, apiHost, token }: FetchConfig, logger: Logger): Promise<Record<string, unknown>>;
