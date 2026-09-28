import { app } from '../../server/app.js';
export async function dev(host, port, validateResources, executionOptions) {
    app(host, Number(port), validateResources, executionOptions);
}
