import type { FunctionResource, InvocationResponse, InvokeContextOptions, InvokeExecutionOptions, InvokePayloadOptions } from '../../utils/types.js';
export declare function testAction(resource: FunctionResource, payload: InvokePayloadOptions, context: InvokeContextOptions, options: InvokeExecutionOptions): Promise<InvocationResponse>;
