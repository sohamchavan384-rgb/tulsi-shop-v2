import { confirm } from '@sanity/cli-core/ux';
export function promptForTypeScript() {
    return confirm({
        default: true,
        message: 'Do you want to use TypeScript?'
    });
}

//# sourceMappingURL=promptForTypescript.js.map