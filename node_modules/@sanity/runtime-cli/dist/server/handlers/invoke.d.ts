import type { InvocationResponse, InvokeContextOptions, InvokeExecutionOptions, InvokePayloadMetadata, NestedInvoke } from '../../utils/types.js';
export declare function handleInvokeRequest(functionName: string, event: Record<string, unknown>, metadata: InvokePayloadMetadata, context: InvokeContextOptions, validateResources: boolean, executionOptions?: Partial<InvokeExecutionOptions>, depth?: number, callStack?: string[], onNestedInvoke?: NestedInvoke): Promise<InvocationResponse & {
    timings: Record<string, number>;
}>;
