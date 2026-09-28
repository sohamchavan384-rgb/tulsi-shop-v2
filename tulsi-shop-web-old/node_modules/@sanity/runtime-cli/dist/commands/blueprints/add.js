/**
 * @file
 * @deprecated Use `functions add` instead.
 */
import { Args, Flags } from '@oclif/core';
import { ResolvedCommand } from '../../baseCommands.js';
import { FUNCTION_TYPES } from '../../constants.js';
import { functionAddCore } from '../../cores/functions/add.js';
import { warn } from '../../utils/display/presenters.js';
import { Logger } from '../../utils/logger.js';
import { INSTALLER_OPTIONS } from '../../utils/types.js';
export default class AddCommand extends ResolvedCommand {
    static needs = ['blueprint'];
    static state = 'deprecated';
    static deprecationOptions = {
        to: 'functions add',
    };
    static summary = '[deprecated] Use "functions add" instead';
    static description = `This command is deprecated. Use "functions add" instead.

Equivalent usage:
  $ <%= config.bin %> functions add
  $ <%= config.bin %> functions add --name my-function --type document-create`;
    static examples = [
        '<%= config.bin %> <%= command.id %> function',
        '<%= config.bin %> <%= command.id %> function --helpers',
        '<%= config.bin %> <%= command.id %> function --name my-function',
        '<%= config.bin %> <%= command.id %> function --name my-function --fn-type document-create',
        '<%= config.bin %> <%= command.id %> function --name my-function --fn-type document-create --fn-type document-update --lang js',
    ];
    static args = {
        type: Args.string({
            description: 'Type of resource to add (only "function" is supported)',
            options: ['function'],
            required: true,
        }),
    };
    static flags = {
        example: Flags.string({
            description: 'Example to use for the function resource. Discover examples at https://www.sanity.io/exchange/type=recipes/by=sanity',
            aliases: ['recipe'],
            exclusive: ['name', 'fn-type', 'language', 'javascript', 'fn-helpers', 'fn-installer'],
        }),
        name: Flags.string({
            description: 'Name of the resource to add',
            char: 'n',
        }),
        'fn-type': Flags.string({
            description: 'Document change event(s) that should trigger the function; you can specify multiple events by specifying this flag multiple times',
            options: FUNCTION_TYPES,
            aliases: ['function-type'],
            multiple: true,
            multipleNonGreedy: true,
            dependsOn: ['name'],
        }),
        language: Flags.string({
            description: 'Language of the new function',
            aliases: ['function-language', 'fn-language', 'lang'],
            options: ['ts', 'js'],
            default: 'ts',
        }),
        javascript: Flags.boolean({
            description: 'Use JavaScript instead of TypeScript',
            aliases: ['js'],
            exclusive: ['language'],
        }),
        'fn-helpers': Flags.boolean({
            description: 'Add helpers to the new function',
            aliases: ['function-helpers', 'helpers'],
            allowNo: true,
        }),
        'fn-installer': Flags.string({
            description: 'Which package manager to use when installing the @sanity/functions helpers',
            aliases: ['function-installer', 'installer'],
            options: ['skip', ...INSTALLER_OPTIONS],
        }),
        install: Flags.boolean({
            description: 'Shortcut for --fn-installer npm',
            char: 'i',
            exclusive: ['fn-installer'],
        }),
    };
    async run() {
        const { blueprint, flags, args: { type: resourceType }, config: { bin }, } = this;
        if (resourceType !== 'function') {
            this.error(`Unsupported Resource type: ${resourceType}`);
        }
        this.log(warn(`"${bin} blueprints add" is deprecated and will be removed in a future release. Use "${bin} functions add" instead.`));
        const result = await functionAddCore({
            bin,
            log: Logger(this.log.bind(this), this.flags),
            blueprint,
            validateResources: flags['validate-resources'],
            flags: {
                example: flags.example,
                name: flags.name,
                type: flags['fn-type'],
                language: flags.language,
                javascript: flags.javascript,
                helpers: flags['fn-helpers'],
                installer: flags['fn-installer'],
                install: flags.install,
            },
        });
        if (!result.success)
            this.coreError(result);
    }
}
