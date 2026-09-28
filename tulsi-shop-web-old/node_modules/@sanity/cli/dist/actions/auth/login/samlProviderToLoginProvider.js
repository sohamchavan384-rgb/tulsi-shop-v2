/**
 * Converts a SAML login provider shape to a login provider shape
 *
 * @param saml - The SAML login provider
 * @returns The login provider
 * @internal
 */ export function samlProviderToLoginProvider(saml) {
    return {
        name: saml.name,
        title: saml.name,
        url: saml.loginUrl
    };
}

//# sourceMappingURL=samlProviderToLoginProvider.js.map