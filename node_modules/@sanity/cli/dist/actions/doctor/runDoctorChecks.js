export async function runDoctorChecks(context, checks) {
    const results = [];
    // Run checks sequentially (some may depend on earlier results in the future)
    for (const check of checks){
        let result;
        try {
            result = await check.run(context);
        } catch (err) {
            result = {
                messages: [
                    {
                        text: err instanceof Error ? err.message : String(err),
                        type: 'error'
                    }
                ],
                status: 'error'
            };
        }
        results.push({
            ...result,
            name: check.name,
            title: check.title
        });
    }
    // Calculate summary
    const summary = {
        errors: 0,
        passed: 0,
        warnings: 0
    };
    for (const result of results){
        switch(result.status){
            case 'error':
                {
                    summary.errors++;
                    break;
                }
            case 'passed':
                {
                    summary.passed++;
                    break;
                }
            case 'warning':
                {
                    summary.warnings++;
                    break;
                }
        }
    }
    return {
        checks: results,
        summary
    };
}

//# sourceMappingURL=runDoctorChecks.js.map