import { defineTrace } from '@sanity/telemetry';
/** @public */ export const TypesGeneratedTrace = defineTrace({
    description: 'Trace emitted when generating TypeScript types for queries',
    name: 'Types Generated',
    version: 0
});
/** @public */ export const TypegenWatchModeTrace = defineTrace({
    description: 'Trace emitted when typegen watch mode is run',
    name: 'Typegen Watch Mode Started',
    version: 0
});

//# sourceMappingURL=typegen.telemetry.js.map