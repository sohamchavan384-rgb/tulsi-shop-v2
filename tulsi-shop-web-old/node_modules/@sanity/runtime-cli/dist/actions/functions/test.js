import invoke from '../../utils/functions/invoke/local.js';
export async function testAction(resource, payload, context, options) {
    try {
        const { json, logs, error } = await invoke(resource, payload, context, options);
        return { error, json, logs };
    }
    catch (error) {
        return { error: error, json: undefined, logs: undefined };
    }
}
