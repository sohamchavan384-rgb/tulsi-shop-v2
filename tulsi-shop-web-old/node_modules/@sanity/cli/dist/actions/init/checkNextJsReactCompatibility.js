import { readPackageJson } from '@sanity/cli-core';
import { coerce } from 'semver';
export async function checkNextJsReactCompatibility({ detectedFramework, output, outputPath }) {
    const packageJson = await readPackageJson(`${outputPath}/package.json`);
    const reactVersion = packageJson?.dependencies?.react;
    if (reactVersion) {
        const isUsingReact19 = coerce(reactVersion)?.major === 19;
        const isUsingNextJs15 = coerce(detectedFramework?.detectedVersion)?.major === 15;
        if (isUsingNextJs15 && isUsingReact19) {
            output.warn('╭────────────────────────────────────────────────────────────╮');
            output.warn('│                                                            │');
            output.warn('│ It looks like you are using Next.js 15 and React 19        │');
            output.warn('│ Please read our compatibility guide.                       │');
            output.warn('│ https://www.sanity.io/help/react-19                        │');
            output.warn('│                                                            │');
            output.warn('╰────────────────────────────────────────────────────────────╯');
        }
    }
}

//# sourceMappingURL=checkNextJsReactCompatibility.js.map