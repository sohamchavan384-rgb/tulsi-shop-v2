import { defineTrace } from '@sanity/telemetry';
export const StudioBuildTrace = defineTrace({
    description: 'A Studio build completed',
    name: 'Studio Build Completed',
    version: 0
});
export const AppBuildTrace = defineTrace({
    description: 'An App build completed',
    name: 'App Build Completed',
    version: 0
});

//# sourceMappingURL=build.telemetry.js.map