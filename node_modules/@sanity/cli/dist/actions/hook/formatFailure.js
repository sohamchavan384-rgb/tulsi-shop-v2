export function formatFailure(attempt, options = {}) {
    const { includeHelp } = options;
    const { failureReason, id, resultCode } = attempt;
    const help = includeHelp ? `(run \`sanity hook attempt ${id}\` for details)` : '';
    switch(failureReason){
        case 'http':
            {
                return `HTTP ${resultCode} ${help}`;
            }
        case 'network':
            {
                return 'Network error';
            }
        case 'other':
            {
                return 'Unknown error';
            }
        case 'timeout':
            {
                return 'Request timed out';
            }
        default:
            {
                return `Unknown error (${failureReason})`;
            }
    }
}

//# sourceMappingURL=formatFailure.js.map