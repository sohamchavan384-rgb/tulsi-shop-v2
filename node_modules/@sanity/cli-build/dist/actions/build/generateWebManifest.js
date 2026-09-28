/**
 * @internal
 */ /**
 * @internal
 */ export function generateWebManifest(basePath) {
    return {
        icons: [
            {
                sizes: '96x96',
                src: `${basePath}/favicon-96.png`,
                type: 'image/png'
            },
            {
                sizes: '192x192',
                src: `${basePath}/favicon-192.png`,
                type: 'image/png'
            },
            {
                sizes: '512x512',
                src: `${basePath}/favicon-512.png`,
                type: 'image/png'
            }
        ]
    };
}

//# sourceMappingURL=generateWebManifest.js.map