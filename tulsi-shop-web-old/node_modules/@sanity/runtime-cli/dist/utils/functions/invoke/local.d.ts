import { type FunctionGroqResource, type FunctionResource, type InvocationResponse, type InvokeContextOptions, type InvokeExecutionOptions, type InvokeGroqPayloadOptions, type InvokePayloadOptions } from '../../types.js';
export declare function sanitizeLogs(logs: string): string;
export declare function applyGroqRule(resource: FunctionGroqResource, payload: InvokeGroqPayloadOptions, projectId: string | undefined, dataset: string | undefined): Promise<any>;
export default function invoke(resource: FunctionResource, payload: InvokePayloadOptions, context: InvokeContextOptions, options: InvokeExecutionOptions): Promise<InvocationResponse>;
