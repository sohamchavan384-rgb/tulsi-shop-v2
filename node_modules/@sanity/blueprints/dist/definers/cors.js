import { validateCorsOrigin } from '../index.js';
import { runValidation } from '../utils/validation.js';
/*
 * FUTURE example (move below @example when ready)
 * @example All options
 * ```ts
 * defineCorsOrigin({
 *   name: 'studio-cors',
 *   origin: 'https://my-studio.sanity.studio',
 *   allowCredentials: true,
 *   project: 'my-project-id',
 * })
 * ```
 */
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
export function defineCorsOrigin(parameters) {
    const corsResource = {
        ...parameters,
        allowCredentials: parameters.allowCredentials || false,
        type: 'sanity.project.cors',
    };
    runValidation(() => validateCorsOrigin(corsResource));
    return corsResource;
}
//# sourceMappingURL=cors.js.map