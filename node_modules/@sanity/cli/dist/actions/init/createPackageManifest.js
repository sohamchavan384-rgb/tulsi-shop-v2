const manifestPropOrder = [
    'name',
    'private',
    'version',
    'type',
    'description',
    'main',
    'author',
    'license',
    'scripts',
    'keywords',
    'dependencies',
    'devDependencies'
];
export function createPackageManifest(data) {
    const { isAppTemplate } = data;
    const dependencies = data.dependencies ? {
        dependencies: sortKeys(data.dependencies)
    } : {};
    const devDependencies = data.devDependencies ? {
        devDependencies: sortKeys(data.devDependencies)
    } : {};
    // Don't write a prettier config for SDK apps; we want to allow developers to use their own
    const prettierConfig = isAppTemplate ? {} : {
        prettier: {
            bracketSpacing: false,
            printWidth: 100,
            semi: false,
            singleQuote: true
        }
    };
    const type = data.type ? {
        type: data.type
    } : {};
    const pkg = {
        ...getCommonManifest(data),
        keywords: [
            'sanity'
        ],
        main: 'package.json',
        ...type,
        scripts: data.scripts || {
            build: 'sanity build',
            deploy: 'sanity deploy',
            ...isAppTemplate ? {} : {
                'deploy-graphql': 'sanity graphql deploy'
            },
            dev: 'sanity dev',
            start: 'sanity start'
        },
        ...dependencies,
        ...devDependencies,
        ...prettierConfig
    };
    return serializeManifest(pkg);
}
function getCommonManifest(data) {
    const pkg = {
        name: data.name,
        version: '1.0.0',
        ...data.author ? {
            author: data.author
        } : {},
        ...data.description ? {
            description: data.description
        } : {},
        license: data.license || 'UNLICENSED'
    };
    if (pkg.license === 'UNLICENSED') {
        pkg.private = true;
    }
    if (data.gitRemote) {
        pkg.repository = {
            type: 'git',
            url: data.gitRemote
        };
    }
    return pkg;
}
function sortKeys(obj) {
    return Object.fromEntries(Object.entries(obj).toSorted(([a], [b])=>a.localeCompare(b)));
}
function serializeManifest(src) {
    const props = [
        ...manifestPropOrder,
        ...Object.keys(src)
    ];
    const ordered = {};
    for (const prop of props){
        const source = src;
        if (source[prop] !== undefined && ordered[prop] === undefined) {
            ordered[prop] = source[prop];
        }
    }
    return `${JSON.stringify(ordered, null, 2)}\n`;
}

//# sourceMappingURL=createPackageManifest.js.map