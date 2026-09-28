import { subdebug } from '@sanity/cli-core';
import { detectAvailableEditors } from '../mcp/detectAvailableEditors.js';
import { getSkillsCliAgent } from '../mcp/editorConfigs.js';
import { setupSkills } from './setupSkills.js';
const debug = subdebug('skills:configure');
const NO_EDITORS_MESSAGE = 'No supported editors detected for Sanity agent skills. See https://www.sanity.io/docs/ai/skills for manual setup.';
/**
 * Standalone, MCP-free orchestration for installing Sanity agent skills for
 * the user's detected AI editors. Forwards every detected agent with a
 * skills-CLI mapping to `setupSkills` without prompting.
 *
 * Re-running is intentional: `skills add ... -g -y` reinstalls (overwrites) the
 * skill files in place, so a subsequent `sanity skills install` updates
 * already-installed skills to the latest version. Failures are surfaced as
 * warnings and never thrown.
 */ export async function configureSkills(options) {
    const { output } = options;
    const editors = options.editors ?? await detectAvailableEditors();
    const detectedEditors = editors.map((e)=>e.name);
    debug('Detected %d editors: %s', detectedEditors.length, detectedEditors);
    const agents = [
        ...new Set(editors.flatMap((editor)=>{
            const agent = getSkillsCliAgent(editor.name);
            return agent ? [
                agent
            ] : [];
        }))
    ];
    if (agents.length === 0) {
        output.warn(NO_EDITORS_MESSAGE);
        return {
            detectedEditors,
            installedAgents: [],
            skipped: true
        };
    }
    const result = await setupSkills({
        agents,
        output
    });
    return {
        detectedEditors,
        error: result.error,
        installedAgents: result.installedAgents,
        skipped: result.skipped
    };
}

//# sourceMappingURL=configureSkills.js.map