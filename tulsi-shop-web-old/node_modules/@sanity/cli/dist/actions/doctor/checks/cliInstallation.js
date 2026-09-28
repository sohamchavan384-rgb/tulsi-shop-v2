import { detectCliInstallation } from '../../../util/packageManager/installationInfo/detectCliInstallation.js';
export const cliInstallationCheck = {
    name: 'cli',
    title: 'CLI Installation',
    async run (context) {
        const info = await detectCliInstallation({
            cwd: context.cwd
        });
        const messages = [];
        // Check if we're in a studio folder (sanity is declared or installed)
        const sanityPkg = info.packages.sanity;
        const isStudioFolder = sanityPkg?.declared || sanityPkg?.installed;
        if (!isStudioFolder) {
            messages.push({
                text: 'No Sanity studio detected in this directory. Run inside a studio folder for full diagnostics.',
                type: 'info'
            });
            return {
                messages,
                status: 'passed'
            };
        }
        // Map issues to messages
        if (info.issues.length === 0) {
            // Everything is fine — brief success
            const version = sanityPkg?.installed?.version;
            messages.push({
                text: version ? `sanity@${version} — no issues found` : 'No issues found',
                type: 'success'
            });
        } else {
            // Add each issue as a self-contained message
            for (const issue of info.issues){
                const suggestions = [];
                if (issue.suggestion) {
                    suggestions.push(issue.suggestion);
                }
                messages.push({
                    suggestions: suggestions.length > 0 ? suggestions : undefined,
                    text: issue.message,
                    type: issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'info'
                });
            }
        }
        // Determine overall status
        const hasErrors = info.issues.some((i)=>i.severity === 'error');
        const hasWarnings = info.issues.some((i)=>i.severity === 'warning');
        const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'passed';
        return {
            messages,
            status
        };
    }
};

//# sourceMappingURL=cliInstallation.js.map