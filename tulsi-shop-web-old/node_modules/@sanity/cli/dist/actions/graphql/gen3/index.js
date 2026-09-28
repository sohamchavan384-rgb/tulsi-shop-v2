import { isUnion, stripInternalMeta } from '../helpers.js';
import { generateTypeFilters } from './generateTypeFilters.js';
import { generateTypeQueries } from './generateTypeQueries.js';
import { generateTypeSortings } from './generateTypeSortings.js';
const gen3 = (extracted, options)=>{
    const documentInterface = extracted.interfaces.find((iface)=>iface.name === 'Document');
    if (!documentInterface || isUnion(documentInterface)) {
        throw new Error('Failed to find document interface');
    }
    const types = [
        ...extracted.types,
        documentInterface
    ];
    const filters = generateTypeFilters(types, options);
    const sortings = generateTypeSortings(types);
    const queries = generateTypeQueries(types, sortings.filter((node)=>node.kind === 'InputObject'), options);
    return {
        generation: 'gen3',
        interfaces: extracted.interfaces,
        queries,
        types: [
            ...stripInternalMeta(extracted.types),
            ...filters,
            ...sortings
        ]
    };
};
export default gen3;

//# sourceMappingURL=index.js.map