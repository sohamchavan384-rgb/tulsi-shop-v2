import { getSanityUrl } from '@sanity/cli-core';
export function getManageUrl(projectId) {
    return projectId ? getSanityUrl(`/manage/project/${projectId}`) : getSanityUrl('/manage/');
}

//# sourceMappingURL=getManageUrl.js.map