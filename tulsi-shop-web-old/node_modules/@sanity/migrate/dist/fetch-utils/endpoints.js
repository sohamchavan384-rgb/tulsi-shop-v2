export var endpoints = {
    data: {
        export: function _export(dataset, documentTypes) {
            return {
                global: false,
                method: 'GET',
                path: "/data/export/".concat(dataset),
                searchParams: documentTypes && (documentTypes === null || documentTypes === void 0 ? void 0 : documentTypes.length) > 0 ? [
                    [
                        'types',
                        documentTypes.join(',')
                    ]
                ] : []
            };
        },
        mutate: function mutate(dataset, options) {
            var params = [
                (options === null || options === void 0 ? void 0 : options.tag) && [
                    'tag',
                    options.tag
                ],
                (options === null || options === void 0 ? void 0 : options.returnIds) && [
                    'returnIds',
                    'true'
                ],
                (options === null || options === void 0 ? void 0 : options.returnDocuments) && [
                    'returnDocuments',
                    'true'
                ],
                (options === null || options === void 0 ? void 0 : options.autoGenerateArrayKeys) && [
                    'autoGenerateArrayKeys',
                    'true'
                ],
                (options === null || options === void 0 ? void 0 : options.visibility) && [
                    'visibility',
                    options.visibility
                ],
                (options === null || options === void 0 ? void 0 : options.dryRun) && [
                    'dryRun',
                    'true'
                ]
            ].filter(Boolean);
            return {
                global: false,
                method: 'POST',
                path: "/data/mutate/".concat(dataset),
                searchParams: params
            };
        },
        query: function query(dataset) {
            return {
                global: false,
                method: 'GET',
                path: "/query/".concat(dataset),
                searchParams: [
                    [
                        'perspective',
                        'raw'
                    ]
                ]
            };
        }
    },
    users: {
        me: function me() {
            return {
                global: true,
                method: 'GET',
                path: '/users/me',
                searchParams: []
            };
        }
    }
};
