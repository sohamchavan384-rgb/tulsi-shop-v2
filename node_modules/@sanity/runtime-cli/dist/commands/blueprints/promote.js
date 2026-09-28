import { Flags } from '@oclif/core';
import { projectIdFlagConfig, ResolvedCommand } from '../../baseCommands.js';
import { blueprintPromoteCore } from '../../cores/blueprints/promote.js';
import { Logger } from '../../utils/logger.js';
export default class PromoteCommand extends ResolvedCommand {
    static needs = ['deployedStack', 'blueprint'];
    static summary = 'Promote a Stack from project scope to organization scope';
    static description = `Promotes a deployed Stack to organization scope, enabling management of org-level resources. Promotion cannot be reversed.

Your local Blueprint configuration will be updated to reflect the new scope.`;
    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --stack <name-or-id>',
        '<%= config.bin %> <%= command.id %> --project-id <projectId> --stack <name-or-id>',
        '<%= config.bin %> <%= command.id %> --new-stack-name <new-name>',
    ];
    static flags = {
        stack: Flags.string({
            description: 'Stack name or ID to promote',
            aliases: ['id'],
        }),
        'project-id': Flags.string({ ...projectIdFlagConfig }),
        force: Flags.boolean({
            description: 'Skip confirmation prompt',
            default: false,
        }),
        'new-stack-name': Flags.string({
            description: 'Set a new name for the Stack while promoting',
        }),
    };
    async run() {
        const result = await blueprintPromoteCore({
            bin: this.config.bin,
            log: Logger(this.log.bind(this), this.flags),
            token: this.sanityToken,
            blueprint: this.blueprint,
            stackId: this.stackId,
            scopeType: this.scopeType,
            scopeId: this.scopeId,
            deployedStack: this.deployedStack,
            auth: this.auth,
            validateResources: this.flags['validate-resources'],
            flags: this.flags,
        });
        if (!result.success)
            this.coreError(result);
        return result.json;
    }
}
