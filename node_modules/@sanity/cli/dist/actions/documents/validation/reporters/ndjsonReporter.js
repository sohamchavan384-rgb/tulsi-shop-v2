import omit from 'lodash-es/omit.js';
export const ndjson = async ({ output, worker })=>{
    let overallLevel = 'info';
    for await (const item of worker.stream.validation()){
        const result = omit(item, [
            'validatedCount'
        ]);
        if (result.level === 'error') overallLevel = 'error';
        if (result.level === 'warning' && overallLevel !== 'error') overallLevel = 'warning';
        if (result.markers.length > 0) {
            output.log(JSON.stringify(result));
        }
    }
    await worker.dispose();
    return overallLevel;
};

//# sourceMappingURL=ndjsonReporter.js.map