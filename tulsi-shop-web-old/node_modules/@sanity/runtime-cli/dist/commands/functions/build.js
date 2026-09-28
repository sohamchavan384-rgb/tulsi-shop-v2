import { Args, Flags } from '@oclif/core';
import { ResolvedCommand } from '../../baseCommands.js';
import { functionBuildCore } from '../../cores/functions/build.js';
import { Logger } from '../../utils/logger.js';
import { INSTALLER_OPTIONS } from '../../utils/types.js';
export default class BuildCommand extends ResolvedCommand {
    static needs = ['blueprint'];
    static summary = 'Build Sanity Function(s) to zip archives';
    static hidden = true;
    static args = {
        name: Args.string({ description: 'The name of the Sanity Function', required: false }),
    };
    static flags = {
        'fn-installer': Flags.string({
            description: 'Which package manager to use when building Functions',
            aliases: ['function-installer', 'installer'],
            options: [...INSTALLER_OPTIONS],
            hidden: true,
        }),
        'out-dir': Flags.string({ char: 'o', description: 'Output directory for zip files' }),
    };
    async run() {
        const result = await functionBuildCore({
            bin: this.config.bin,
            log: Logger(this.log.bind(this), this.flags),
            args: { name: this.args.name },
            flags: this.flags,
            blueprint: this.blueprint,
            validateResources: this.flags['validate-resources'],
        });
        if (!result.success)
            this.coreError(result);
        return result.json;
    }
}
