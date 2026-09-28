import { Flags } from '@oclif/core';
import { organizationIdFlagConfig, projectIdFlagConfig, ResolvedCommand, stackFlagConfig, } from '../../baseCommands.js';
import { blueprintPlanCore } from '../../cores/blueprints/plan.js';
import { Logger } from '../../utils/logger.js';
export default class PlanCommand extends ResolvedCommand {
    static needs = ['token', 'blueprint'];
    static summary = 'Preview changes that will be applied to the remote Stack';
    static description = `Use this command to preview what changes will be applied to your remote Stack before deploying. This is a safe, read-only operation—no resources are created, modified, or deleted.

Run 'blueprints plan' after making local changes to your Blueprint manifest to verify the expected diff. When ready, run 'blueprints deploy' to apply changes.`;
    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --stack <name-or-id>',
        '<%= config.bin %> <%= command.id %> --organization-id <orgId> --stack <name-or-id>',
    ];
    static flags = {
        stack: Flags.string({ ...stackFlagConfig }),
        'project-id': Flags.string({ ...projectIdFlagConfig }),
        'organization-id': Flags.string({ ...organizationIdFlagConfig }),
    };
    async run() {
        const result = await blueprintPlanCore({
            bin: this.config.bin,
            log: Logger(this.log.bind(this), this.flags),
            token: this.sanityToken,
            blueprint: this.blueprint,
            flags: this.flags,
        });
        if (!result.success)
            this.coreError(result);
        if (result.warnings)
            this.renderWarnings(result?.warnings);
        return result.json;
    }
}
