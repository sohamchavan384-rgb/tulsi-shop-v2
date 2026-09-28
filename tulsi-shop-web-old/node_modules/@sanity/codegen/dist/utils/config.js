export function prepareConfig(config) {
    return {
        formatGeneratedCode: config?.formatGeneratedCode ?? false,
        generates: config?.generates ?? 'sanity.types.ts',
        overloadClientMethods: config?.overloadClientMethods ?? false,
        path: config?.path ?? './src/**/*.{ts,tsx,js,jsx}',
        schema: config?.schema ?? 'schema.json'
    };
}

//# sourceMappingURL=config.js.map