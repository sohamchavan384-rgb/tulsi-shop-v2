import { stripInternalMeta } from '../helpers.js';
import { generateTypeFilters } from './generateTypeFilters.js';
import { generateTypeQueries } from './generateTypeQueries.js';
import { generateTypeSortings } from './generateTypeSortings.js';
const gen2 = (extracted)=>{
    const filters = generateTypeFilters(extracted.types);
    const sortings = generateTypeSortings(extracted.types);
    const queries = generateTypeQueries(extracted.types, sortings.filter((node)=>node.kind === 'InputObject'));
    return {
        generation: 'gen2',
        interfaces: extracted.interfaces,
        queries,
        types: [
            ...stripInternalMeta(extracted.types),
            ...filters,
            ...sortings
        ]
    };
};
export default gen2;

//# sourceMappingURL=index.js.map