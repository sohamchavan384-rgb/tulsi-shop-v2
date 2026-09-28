import { defineTrace } from '@sanity/telemetry';
export const CliCommandTelemetry = defineTrace({
    description: 'A CLI command was executed',
    name: 'CLI Command Executed',
    version: 1
});

//# sourceMappingURL=cli.telemetry.js.map