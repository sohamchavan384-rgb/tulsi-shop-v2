import { cwd } from 'node:process';
import { styleText } from '../style-text.js';
export function check(str) {
    return `${styleText('bold', styleText('green', '✔︎'))} ${str}`;
}
export function info(str) {
    return `${styleText(['bold', 'blue'], 'ℹ︎')} ${str}`;
}
export function warn(str) {
    return `${styleText(['bold', 'yellow'], '▶︎')} ${str}`;
}
export function advise(str) {
    return `${styleText(['bold', 'yellow'], '!')} ${str}`;
}
export function unsure(str) {
    return `${styleText(['bold', 'cyan'], '?')} ${str}`;
}
export function severe(str) {
    return `${styleText(['bold', 'red'], '✘')} ${str}`;
}
export function niceId(id) {
    if (!id)
        return '';
    return `<${styleText('yellow', id)}>`;
}
export function indent(str, spaces = 2) {
    const pad = ' '.repeat(spaces);
    return str
        .split('\n')
        .map((line) => (line.length > 0 ? pad + line : line))
        .join('\n');
}
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
export function filePathRelativeToCwd(filePath) {
    return filePath.replace(cwd(), '.');
}
export function labeledId(label, id) {
    return `${styleText('blue', capitalize(label || 'unknown'))} ${niceId(id || 'unknown')}`;
}
export function renderSection(title, rows) {
    const pad = Math.max(...rows.map(([l]) => l.length)) + 3;
    const lines = [styleText('bold', title)];
    for (const [label, value] of rows) {
        lines.push(`  ${styleText('dim', label.padEnd(pad))}${value}`);
    }
    return lines.join('\n');
}
