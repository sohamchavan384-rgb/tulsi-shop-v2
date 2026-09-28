export function createDocumentFilters() {
    return {
        fields: [
            {
                description: 'All documents referencing the given document ID.',
                fieldName: 'references',
                type: 'ID'
            },
            {
                description: 'All documents that are drafts.',
                fieldName: 'is_draft',
                type: 'Boolean'
            }
        ],
        isConstraintFilter: true,
        kind: 'InputObject',
        name: 'DocumentFilter'
    };
}

//# sourceMappingURL=documentFilters.js.map