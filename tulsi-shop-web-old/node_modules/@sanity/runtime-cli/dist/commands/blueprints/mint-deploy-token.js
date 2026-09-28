import { Flags } from '@oclif/core';
import { organizationIdFlagConfig, projectIdFlagConfig, ResolvedCommand } from '../../baseCommands.js';
import { blueprintMintDeployTokenCore } from '../../cores/blueprints/mint-deploy-token.js';
import { Logger } from '../../utils/logger.js';
export default class MintDeployTokenCommand extends ResolvedCommand {
    static needs = ['scope'];
    static summary = 'Create a robot API token for deploying Blueprints from CI/CD';
    static description = `Mints a long-lived robot token with the role required to plan, deploy, and destroy Blueprints in this project or organization.

By default the command runs interactively and asks how you want to receive the token (clipboard, print, or exit). Use --print to emit only the raw token for shell pipelines, or --json for full API output.

The minted token is also visible in your Sanity Manage UI under Robots, where it can be revoked.`;
    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --label "ci-deploy"',
        '<%= config.bin %> <%= command.id %> --print',
        'export SANITY_AUTH_TOKEN=$(<%= config.bin %> <%= command.id %> --print)',
        '<%= config.bin %> <%= command.id %> --json',
        '<%= config.bin %> <%= command.id %> --project-id <projectId>',
        '<%= config.bin %> <%= command.id %> --organization-id <orgId>',
    ];
    static flags = {
        label: Flags.string({
            description: 'Human-readable label for the robot. Defaults to a generated value.',
        }),
        'project-id': Flags.string({ ...projectIdFlagConfig }),
        'organization-id': Flags.string({ ...organizationIdFlagConfig }),
        print: Flags.boolean({
            char: 'P',
            description: 'Print only the raw token to stdout (suitable for shell substitution)',
            exclusive: ['json'],
        }),
    };
    async run() {
        const result = await blueprintMintDeployTokenCore({
            bin: this.config.bin,
            log: Logger(this.log.bind(this), this.flags),
            auth: this.auth,
            scopeType: this.scopeType,
            scopeId: this.scopeId,
            flags: this.flags,
        });
        if (!result.success)
            this.coreError(result);
        return result.json;
    }
}
