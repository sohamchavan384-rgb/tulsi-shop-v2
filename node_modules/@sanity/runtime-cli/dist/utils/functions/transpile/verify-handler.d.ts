import type { build } from 'vite';
export declare function verifyHandler(result: Awaited<ReturnType<typeof build>>): Promise<void>;
