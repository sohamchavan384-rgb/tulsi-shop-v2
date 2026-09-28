import { type BlueprintCorsOriginConfig, type BlueprintCorsOriginResource } from '../index.js';
/**
 * Defines a CORS Origin to be managed in a Blueprint.
 *
 * ```ts
 * defineCorsOrigin({
 *   name: 'my-cors-origin',
 *   origin: 'https://mydomain.com',
 *   allowCredentials: true,
 * })
 * ```
 * @param parameters The CORS Origin configuration
 * @public
 * @beta Deploying CORS Origins via Blueprints is experimental. This feature is stabilizing but may still be subject to breaking changes.
 * @category Definers
 * @expandType BlueprintCorsOriginConfig
 * @returns The CORS Origin resource
 */
export declare function defineCorsOrigin(parameters: BlueprintCorsOriginConfig): BlueprintCorsOriginResource;
