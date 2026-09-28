import { validateBlueprint } from '../index.js';
import { runValidation } from '../utils/validation.js';
/*
 * FUTURE example (move below @example when ready)
 * @example With deployment API config
 * ```ts
 * defineBlueprint({
 *   resources: [
 *     defineCorsOrigin({
 *       name: 'cors-localhost',
 *       origin: 'http://localhost:3333'
 *     }),
 *     defineRole({
 *       name: 'role-ci',
 *       title: 'CI Role',
 *       appliesToRobots: true,
 *       permissions: []
 *     }),
 *     defineRobotToken({
 *       name: 'ci-robot',
 *       memberships: [{
 *        roleNames: ['$.resources.ci-role']}],
 *     }),
 *   ],
 * })
 * ```
 */
/**
 * Define a Blueprint to manage Sanity resources
 *
 * ```ts
 * defineBlueprint({
 *   resources: [
 *     defineCorsOrigin({
 *       name: 'localhost-origin',
 *       origin: 'http://localhost:3333',
 *     }),
 *     defineDocumentFunction({
 *       name: 'update-search-index',
 *       event: {
 *         on: ['create', 'update'],
 *         filter: "_type == 'post'",
 *         projection: "{_id, title, slug}",
 *       },
 *     }),
 *   ],
 * })
 * ```
 * @param blueprintConfig The blueprint configuration
 * @public
 * @category Definers
 * @returns A blueprint module
 */
export function defineBlueprint(blueprintConfig) {
    const { organizationId, projectId, stackId, blueprintVersion, resources, values, outputs } = blueprintConfig;
    runValidation(() => validateBlueprint(blueprintConfig), { throwError: true });
    function blueprint() {
        return {
            $schema: 'https://schemas.sanity.io/blueprints/v2024-10-01/blueprint.schema.json',
            blueprintVersion: blueprintVersion ?? '2024-10-01',
            resources,
            values,
            outputs,
        };
    }
    blueprint.organizationId = organizationId;
    blueprint.projectId = projectId;
    blueprint.stackId = stackId;
    return blueprint;
}
//# sourceMappingURL=blueprints.js.map