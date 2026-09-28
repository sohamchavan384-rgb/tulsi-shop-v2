import { checkWorkspaceStruct } from './workspace-checks.js';
const workspaceRuleWarnings = [
    {
        code: 'studio',
        suggestions: [
            'Blueprint should not be co-located with a Sanity Studio. See docs for correct layout options:',
            'https://www.sanity.io/docs/blueprints/project-layout-and-monorepos',
        ],
    },
    {
        code: 'floating',
        suggestions: [
            'Blueprint is in a separate directory from its stack. See docs for recommended layout options:',
            'https://www.sanity.io/docs/blueprints/project-layout-and-monorepos',
        ],
    },
    {
        code: 'functions',
        suggestions: [
            'Blueprint is co-located with the functions directory. See docs for correct layout options:',
            'https://www.sanity.io/docs/blueprints/project-layout-and-monorepos',
        ],
    },
];
const workspaceRulesWarnings = (ctx) => {
    const code = checkWorkspaceStruct(ctx.dir);
    const warnings = workspaceRuleWarnings.find((w) => w.code === code);
    return warnings ? [warnings] : [];
};
/**
 * Additive way of generating warnings based upon context
 * At the moment, we have a single workspace warning check,
 * more could be added via [workspaceRulesWarnings, otherWarningChecks, ...]
 */
const rules = [workspaceRulesWarnings];
/**
 * Generates warnings based upon the provided context by running through all rules and returning any matches
 * @param ctx
 */
export const getWarnings = (ctx) => {
    return rules.flatMap((rule) => rule(ctx));
};
