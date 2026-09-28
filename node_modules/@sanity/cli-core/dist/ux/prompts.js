import * as inquirer from '@inquirer/prompts';
import { NonInteractiveError } from '../errors/NonInteractiveError.js';
import { isInteractive } from '../util/isInteractive.js';
export { Separator } from '@inquirer/prompts';
function assertInteractive(promptName) {
    if (!isInteractive()) {
        throw new NonInteractiveError(promptName);
    }
}
export const checkbox = (...args)=>{
    assertInteractive('checkbox');
    return inquirer.checkbox(...args);
};
export const confirm = (...args)=>{
    assertInteractive('confirm');
    return inquirer.confirm(...args);
};
export const editor = (...args)=>{
    assertInteractive('editor');
    return inquirer.editor(...args);
};
export const expand = (...args)=>{
    assertInteractive('expand');
    return inquirer.expand(...args);
};
export const input = (...args)=>{
    assertInteractive('input');
    return inquirer.input(...args);
};
export const number = (...args)=>{
    assertInteractive('number');
    return inquirer.number(...args);
};
export const password = (...args)=>{
    assertInteractive('password');
    return inquirer.password(...args);
};
export const rawlist = (...args)=>{
    assertInteractive('rawlist');
    return inquirer.rawlist(...args);
};
export const search = (...args)=>{
    assertInteractive('search');
    return inquirer.search(...args);
};
export const select = (...args)=>{
    assertInteractive('select');
    return inquirer.select(...args);
};

//# sourceMappingURL=prompts.js.map