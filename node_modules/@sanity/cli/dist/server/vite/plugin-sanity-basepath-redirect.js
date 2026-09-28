export function sanityBasePathRedirectPlugin(basePath) {
    return {
        apply: 'serve',
        configurePreviewServer (vitePreviewServer) {
            return ()=>{
                if (!basePath) {
                    return;
                }
                vitePreviewServer.middlewares.use((req, res, next)=>{
                    if (req.url !== '/') {
                        next();
                        return;
                    }
                    res.writeHead(302, {
                        Location: basePath
                    });
                    res.end();
                });
            };
        },
        name: 'sanity/server/sanity-base-path-redirect'
    };
}

//# sourceMappingURL=plugin-sanity-basepath-redirect.js.map