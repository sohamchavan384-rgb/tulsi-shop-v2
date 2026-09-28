import { defineTrace } from '@sanity/telemetry';
export const LoginTrace = defineTrace({
    description: 'User completed a step in the CLI login flow',
    name: 'CLI Login Step Completed',
    version: 1
});

//# sourceMappingURL=login.telemetry.js.map