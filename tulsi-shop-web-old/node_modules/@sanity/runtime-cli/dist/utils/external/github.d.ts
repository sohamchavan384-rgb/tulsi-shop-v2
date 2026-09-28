import type { Logger } from '../logger.js';
export declare const GITHUB_API_URL = "https://api.github.com";
export declare function gitHubRequest(path: string, logger: Logger): Promise<Response>;
