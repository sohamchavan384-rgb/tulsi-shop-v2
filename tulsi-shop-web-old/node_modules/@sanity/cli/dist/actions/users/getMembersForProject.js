import { getProjectById, getProjectInvites } from '../../services/projects.js';
import { getMembers } from '../../services/user.js';
import { getPendingInvitations } from './getPendingInvitations.js';
import { usersDebug } from './usersDebug.js';
function getUserProps(user) {
    const { createdAt: date, displayName: name } = user || {};
    return {
        date: date || '',
        name: name || ''
    };
}
/**
 * Get all members for a project
 *
 * @returns A list of all members for a project
 */ export async function getMembersForProject({ includeInvitations, includeRobots, projectId }) {
    try {
        const [pendingInvitations, project] = await Promise.all([
            includeInvitations ? getProjectInvites(projectId).then(getPendingInvitations) : [],
            getProjectById(projectId)
        ]);
        const memberIds = project.members// Filter all the robot users if the robots flag is not set
        .filter((member)=>!member.isRobot || includeRobots).map((member)=>member.id);
        const users = await getMembers(memberIds).then((user)=>Array.isArray(user) ? user : [
                user
            ]);
        const projectMembers = project.members.map((member)=>{
            return {
                ...member,
                ...getUserProps(users.find((candidate)=>candidate.id === member.id))
            };
        }).filter((member)=>!member.isRobot || includeRobots);
        const members = [
            ...projectMembers,
            ...pendingInvitations
        ];
        usersDebug(`Found ${projectMembers.length} project members for ${projectId}`);
        usersDebug(`Found ${pendingInvitations.length} pending invitations for ${projectId}`);
        return members;
    } catch (error) {
        throw new Error(`Error fetching members for ${projectId}`, {
            cause: error
        });
    }
}

//# sourceMappingURL=getMembersForProject.js.map