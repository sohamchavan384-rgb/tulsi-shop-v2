export function sanityRuntimeRewritePlugin() {
    return {
        apply: 'serve',
        configureServer (viteDevServer) {
            return ()=>{
                viteDevServer.middlewares.use((req, res, next)=>{
                    if (req.url === '/index.html') {
                        req.url = '/.sanity/runtime/index.html';
                    }
                    next();
                });
            };
        },
        name: 'sanity/server/sanity-runtime-rewrite'
    };
}

//# sourceMappingURL=plugin-sanity-runtime-rewrite.js.map