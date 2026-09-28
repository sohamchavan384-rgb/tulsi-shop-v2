import type {BlueprintProjectResourceLifecycle, BlueprintResource} from '../index.js'

/**
 * Represents a CORS Origin resource.
 * @see https://www.sanity.io/docs/content-lake/cors
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 */
export interface BlueprintCorsOriginResource extends BlueprintResource<BlueprintProjectResourceLifecycle> {
  type: 'sanity.project.cors'
  /**
   * A CORS origin will be defined using the following format: `protocol://hostname[:port]`
   *
   * The protocol and host name are required while the port is optional. Wildcards (*) are allowed.
   */
  origin: string
  /**
   * When adding a CORS origin, you will also need to decide whether or not to allow credentials. If you allow credentials, the origin will be allowed to send authenticated requests using the token or session of a logged in user.
   *
   * If this origin hosts a studio, you will need to allow credentials. Otherwise, you should probably select not to allow credentials.
   *
   * Allowing credentials from wildcard origins is dangerous. Any domain that matches the given pattern will be able to send requests on the user's behalf if they are logged in to your studio.
   */
  allowCredentials?: boolean

  /**
   * The project ID of the project that contains your CORS Origin.
   *
   * The `project` attribute must be defined if your blueprint is scoped to an organization. */
  project?: string
}

/**
 * Configuration for a CORS Origin resource.
 * @see https://www.sanity.io/docs/content-lake/cors
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 * @interface
 */
export type BlueprintCorsOriginConfig = Omit<BlueprintCorsOriginResource, 'type' | 'allowCredentials'> & {
  /**
   * When adding a CORS origin, you will also need to decide whether or not to allow credentials. If you allow credentials, the origin will be allowed to send authenticated requests using the token or session of a logged in user.
   *
   * If this origin hosts a studio, you will need to allow credentials. Otherwise, you should probably select not to allow credentials.
   *
   * Allowing credentials from wildcard origins is dangerous. Any domain that matches the given pattern will be able to send requests on the user's behalf if they are logged in to your studio.
   * @defaultValue false
   */
  allowCredentials?: boolean
}
