import type { Logger } from '../../utils/logger.js';
import type { ActionResponse, AuthParams, ScopeType } from '../../utils/types.js';
export declare const accessApiVersion = "v2025-07-11";
export declare const accessApiPath: string;
export interface RobotMembership {
    resourceType: ScopeType;
    resourceId: string;
    roleNames: string[];
}
export interface CreateRobotInput {
    label: string;
    memberships: RobotMembership[];
}
export interface RobotResponse {
    token: string;
    id: string;
    tokenId: string;
    label: string;
    createdAt: string;
    expiresAt: string;
    memberships: Array<RobotMembership & {
        addedAt: string;
        lastSeenAt?: string;
        resourceUserId?: string;
    }>;
}
interface CreateRobotResponse extends ActionResponse {
    robot: RobotResponse | null;
}
/** Create a robot token via the Access API. */
export declare function createRobotToken({ auth, resourceType, resourceId, body, logger, }: {
    auth: AuthParams;
    resourceType: ScopeType;
    resourceId: string;
    body: CreateRobotInput;
    logger: Logger;
}): Promise<CreateRobotResponse>;
export interface CheckUserPermissionResponse extends ActionResponse {
    hasPermission: boolean;
}
/** Check whether the token's user holds a specific permission on a project or organization. */
export declare function checkUserPermission({ auth, resourceType, resourceId, permission, logger, }: {
    auth: AuthParams;
    resourceType: ScopeType;
    resourceId: string;
    permission: string;
    logger: Logger;
}): Promise<CheckUserPermissionResponse>;
export {};
