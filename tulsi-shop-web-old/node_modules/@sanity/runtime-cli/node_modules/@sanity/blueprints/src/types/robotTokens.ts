import type {BlueprintProjectResourceLifecycle, BlueprintResource} from './resources'

/**
 * Resource types that robot tokens can be attached to.
 * @internal
 */
export type RobotTokenResourceType = 'organization' | 'project'

/**
 * Defines the robot token's roles within a given resource. Membership scope defaults to the robot token's scope.
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 * @expand
 */
export interface RobotTokenMembership {
  resourceType?: RobotTokenResourceType
  resourceId?: string
  roleNames: string[]
}

/**
 * A robot token that provides automated access.
 * @see https://www.sanity.io/docs/content-lake/http-auth#k4c21d7b829fe
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 */
export interface BlueprintRobotTokenResource extends BlueprintResource<BlueprintProjectResourceLifecycle> {
  type: 'sanity.access.robot'
  /** A descriptive label for the robot token and its use case */
  label: string
  memberships: RobotTokenMembership[]

  resourceType?: RobotTokenResourceType
  resourceId?: string
}

/**
 * Configuration for a robot token that provides automated access.
 * @see https://www.sanity.io/docs/content-lake/http-auth#k4c21d7b829fe
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 * @interface
 */
export type BlueprintRobotTokenConfig = Omit<BlueprintRobotTokenResource, 'type' | 'label' | 'token'> & {
  /**
   * A descriptive label for the robot token and its use case
   * @defaultValue The `name` of the resource
   */
  label?: string
}
