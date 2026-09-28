import { type Blueprint, type BlueprintModule, type BlueprintsApiConfig } from '../index.js';
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
export declare function defineBlueprint(blueprintConfig: Partial<Blueprint> & Partial<BlueprintsApiConfig>): BlueprintModule;
