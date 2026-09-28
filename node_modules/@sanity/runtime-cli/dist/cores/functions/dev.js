import { dev } from '../../actions/functions/dev.js';
export async function functionDevCore(options) {
    const { log, flags } = options;
    const { host = 'localhost', port = 8080, timeout } = flags;
    // Construct execution options only if timeout is provided
    const executionOptions = timeout
        ? { timeout }
        : undefined;
    try {
        await dev(host, Number(port), options.validateResources || false, executionOptions);
        log(`Server is running on http://${host}:${port}\n`);
        return {
            success: true,
            // hold the line...
            streaming: new Promise(() => { }),
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error(`Error starting server: ${errorMessage}`);
        return {
            success: false,
            error: errorMessage,
        };
    }
}
