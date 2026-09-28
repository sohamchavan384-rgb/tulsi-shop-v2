import type { BlueprintProjectResourceLifecycle, BlueprintResource } from '../index.js';
/**
 * A permission definition for a role.
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 * @expand
 */
export interface RolePermission {
    /** Predefined permission name (e.g., 'sanity-all-documents') */
    name: string;
    /** Permission action (e.g., 'read', 'mode') */
    action: string;
    /** Additional parameters for the permission */
    params?: Record<string, unknown>;
}
/**
 * Configuration for a custom role.
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 */
export interface BlueprintRoleConfig extends Omit<BlueprintResource<BlueprintProjectResourceLifecycle>, 'type'> {
    title: string;
    description?: string;
    appliesToUsers: boolean;
    appliesToRobots: boolean;
    permissions: RolePermission[];
}
/**
 * A custom role resource
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 */
export interface BlueprintRoleResource extends BlueprintRoleConfig, BlueprintResource<BlueprintProjectResourceLifecycle> {
    type: 'sanity.access.role';
}
/**
 * A custom role resource that is tied to a specific project
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 */
export interface BlueprintProjectRoleResource extends BlueprintRoleResource {
    resourceType: 'project';
    resourceId: string;
}
