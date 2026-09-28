import { getCliConfigUncached } from '@sanity/cli-core';
const noop = async ()=>{};
/**
 * Own the app/studio dev server's lifecycle behind the dev-server registry seam.
 *
 * Adding or removing a view/service rebuilds the federation remote: its
 * module-federation `exposes` map and codegen artifacts are computed once at
 * server start, so a newly-declared interface has no expose until the server is
 * recreated — `server.restart()` can't do it (it reuses the inline config).
 * `rebuild` therefore tears the server down and starts a fresh one with a
 * reloaded config; the registry watcher calls it when the interface set changes.
 *
 * Returns the not-started result verbatim when the initial boot is an expected
 * early exit, so the caller can skip the rest of the orchestration.
 */ export async function startAppServerSupervisor(options) {
    const { cliConfig, start, workDir } = options;
    const initial = await start(cliConfig);
    if (!initial.started) return {
        reason: initial.reason,
        started: false
    };
    // `closeCurrent` repoints at the replacement only once a rebuild succeeds, so a
    // failed rebuild (old server already closed) leaves nothing for close() to re-close.
    let server = initial.server;
    let closeCurrent = initial.close;
    let closed = false;
    // close() waits on this so a rebuild racing teardown can't orphan the replacement.
    // Rejections are the watcher's (warn + retry); the tracked copy is swallowed.
    let rebuildInFlight = Promise.resolve();
    const runRebuild = async ()=>{
        // Refuse once shutting down — a config save in the teardown window must not
        // boot a replacement nobody owns.
        if (closed) throw new Error('Dev server is shutting down');
        const freshConfig = await getCliConfigUncached(workDir);
        await closeCurrent();
        closeCurrent = noop;
        const result = await start(freshConfig);
        if (!result.started) {
            // The server already reported why (e.g. organizationId was removed).
            throw new Error('Dev server did not restart after the view/service change');
        }
        server = result.server;
        closeCurrent = result.close;
        return server;
    };
    return {
        started: true,
        supervisor: {
            async close () {
                closed = true;
                await rebuildInFlight;
                await closeCurrent();
            },
            rebuild () {
                const rebuild = runRebuild();
                rebuildInFlight = rebuild.catch(()=>{});
                return rebuild;
            },
            get server () {
                return server;
            }
        }
    };
}

//# sourceMappingURL=appServerSupervisor.js.map