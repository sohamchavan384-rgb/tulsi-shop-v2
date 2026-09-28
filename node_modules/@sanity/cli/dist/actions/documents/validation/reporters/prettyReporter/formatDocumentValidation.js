import { styleText } from 'node:util';
import { logSymbols } from '@sanity/cli-core/ux';
import { convertToTree, formatTree, maxKeyLength } from './tree.js';
import { isTty, levelValues } from './util.js';
const levelHeaders = {
    error: isTty ? styleText('bold', styleText('bgRed', styleText('black', ' ERROR '))) : styleText('red', '[ERROR]'),
    info: isTty ? styleText('bold', styleText('cyan', styleText('black', ' INFO '))) : styleText('cyan', '[INFO]'),
    warning: isTty ? styleText('bold', styleText('bgYellow', styleText('black', ' WARN '))) : styleText('yellow', '[WARN]')
};
/**
 * Creates a terminal hyperlink. Only outputs a hyperlink if the output is
 * determined to be a TTY
 */ const link = (linkText, url)=>isTty ? `\u001B]8;;${url}\u0007${linkText}\u001B]8;;\u0007` : styleText('underline', linkText);
/**
 * For sorting markers
 */ const compareLevels = (a, b)=>levelValues[a.level] - levelValues[b.level];
/**
 * Formats the markers at the root of the validation tree
 */ const formatRootErrors = (root, hasChildren, paddingLength)=>{
    if (!root.nodes) return '';
    const [first, ...rest] = [
        ...root.nodes
    ].toSorted(compareLevels);
    if (!first) return '';
    const firstElbow = hasChildren ? '│ ' : '└─';
    const firstPadding = '.'.repeat(paddingLength - 6);
    const firstLine = `${firstElbow} (root) ${firstPadding} ${logSymbols[first.level]} ${first.message}`;
    const subsequentPadding = ' '.repeat(paddingLength + 2);
    const subsequentElbow = hasChildren ? '│ ' : '  ';
    const restOfLines = rest.map((marker)=>`${subsequentElbow}${subsequentPadding} ${logSymbols[marker.level]} ${marker.message}`).join('\n');
    return [
        firstLine,
        restOfLines
    ].filter(Boolean).join('\n');
};
/**
 * Formats document validation results into a user-friendly tree structure
 */ export function formatDocumentValidation({ documentId, documentType, intentUrl, level, markers }) {
    const tree = convertToTree(markers);
    const documentTypeHeader = isTty ? styleText('bgWhite', styleText('black', ` ${documentType} `)) : `[${documentType}]`;
    const header = `${levelHeaders[level]} ${documentTypeHeader} ${intentUrl ? link(documentId, intentUrl) : styleText('underline', documentId)}`;
    const paddingLength = Math.max(maxKeyLength(tree.children) + 2, 30);
    const childErrors = formatTree({
        getMessage: (marker)=>[
                logSymbols[marker.level],
                marker.message
            ].join(' '),
        getNodes: ({ nodes })=>[
                ...nodes ?? []
            ].toSorted(compareLevels),
        node: tree.children,
        paddingLength
    });
    const rootErrors = formatRootErrors(tree, childErrors.length > 0, paddingLength);
    return [
        header,
        rootErrors,
        childErrors
    ].filter(Boolean).join('\n');
}

//# sourceMappingURL=formatDocumentValidation.js.map