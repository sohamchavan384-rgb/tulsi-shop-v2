import { SANITY_FUNCTION_PREFIX } from '../../constants.js';
import { isLocalFunctionResource, } from '../types.js';
export function getFunctionNames(resources) {
    return (resources
        ?.filter((r) => r.type.startsWith(SANITY_FUNCTION_PREFIX))
        .map((r) => r.name)
        .filter((name) => typeof name === 'string') ?? []);
}
export function findFunctionInResources(resources, name) {
    const func = resources.filter(isLocalFunctionResource).find((r) => r.name === name);
    if (!func)
        throw Error(`Unable to find function ${name}`);
    return func;
}
/** @deprecated Use findFunctionInResources instead */
export const findFunctionInBlueprint = (blueprint, name) => findFunctionInResources(blueprint?.resources ?? [], name);
export function findFunctionInStack(stack, name) {
    const func = stack?.resources?.filter(isLocalFunctionResource).find((r) => r.name === name);
    if (!func)
        throw Error(`Unable to find function: "${name}"`);
    if (!isDeployedResource(func))
        throw Error(`Unable to find deployed function: "${name}"`);
    // return the deployed resource
    return func;
}
function isDeployedResource(r) {
    return 'externalId' in r && typeof r.externalId === 'string';
}
