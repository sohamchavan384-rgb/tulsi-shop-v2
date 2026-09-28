import register from '@babel/register';
import { getBabelConfig } from '../getBabelConfig.js';
/**
 * Register Babel with the given options
 *
 * @param babelOptions - The options to use when registering Babel
 * @beta
 */ export function registerBabel(babelOptions) {
    const options = babelOptions || getBabelConfig();
    register({
        ...options,
        extensions: [
            '.ts',
            '.tsx',
            '.js',
            '.jsx',
            '.mjs',
            '.cjs'
        ]
    });
}

//# sourceMappingURL=registerBabel.js.map