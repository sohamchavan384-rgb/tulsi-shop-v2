import type { AuthParams, DeployedResource, Stack } from '../types.js';
/**
 * Resolves the correct auth scope for a function API request.
 *
 * 1. explicit `project` or `organization` on the resource parameters (highest priority)
 * 2. stack's `defaultProjectId` for project-scoped function types in org-scoped stacks
 * 3. pass-through the stack's deployment scope (lowest priority)
 */
export declare function resolveFunctionAuth(auth: AuthParams, deployedStack: Stack, resource: DeployedResource): AuthParams;
