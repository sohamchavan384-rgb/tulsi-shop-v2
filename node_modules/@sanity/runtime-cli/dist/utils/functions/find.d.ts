import type { BlueprintResource } from '@sanity/blueprints';
import { type DeployedResource, type FunctionResource, type Stack } from '../types.js';
export declare function getFunctionNames(resources: BlueprintResource[] | undefined): string[];
export declare function findFunctionInResources(resources: BlueprintResource[], name: string): FunctionResource;
/** @deprecated Use findFunctionInResources instead */
export declare const findFunctionInBlueprint: (blueprint: {
    resources?: BlueprintResource[];
}, name: string) => FunctionResource;
export declare function findFunctionInStack(stack: Stack, name: string): DeployedResource;
