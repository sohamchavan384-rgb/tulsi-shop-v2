import { styleText } from '../style-text.js';
import { formatDate, formatTime } from './dates.js';
import { niceId } from './presenters.js';
const errorStyle = ['bold', 'red'];
const newOperationStyle = ['bold', 'blue'];
const GUTTER_SYMBOL_WIDTH = 2;
const GUTTER_LEVEL_WIDTH = 6;
function isNewOperation(log, previousLog) {
    return !!previousLog && log.operationId !== previousLog.operationId;
}
function isErrorLevel(log) {
    const level = log.level?.toUpperCase();
    return level === 'ERROR' || level === 'FATAL';
}
function logGutter(log, useLevel, previousLog) {
    const operationIsNew = isNewOperation(log, previousLog);
    const level = log.level.toUpperCase();
    const isError = isErrorLevel(log);
    if (useLevel) {
        const color = isError ? errorStyle : operationIsNew ? newOperationStyle : 'dim';
        return styleText(color, level.padEnd(GUTTER_LEVEL_WIDTH));
    }
    if (isError)
        return `${styleText(errorStyle, '✗')} `;
    if (operationIsNew)
        return `${styleText(newOperationStyle, '◆')} `;
    return ' '.repeat(GUTTER_SYMBOL_WIDTH);
}
function formatMetadataLines(log) {
    const lines = [];
    const ids = [
        log.operationId ? niceId(log.operationId) : null,
        log.stackId ? niceId(log.stackId) : null,
        log.blueprintId ? niceId(log.blueprintId) : null,
        log.resourceId ? niceId(log.resourceId) : null,
        log.duration ? `${String(log.duration)}ms` : null,
    ].filter(Boolean);
    if (ids.length > 0) {
        lines.push(styleText('dim', ids.join(' ')));
    }
    if (log.metadata) {
        for (const [key, value] of Object.entries(log.metadata)) {
            const formatted = typeof value === 'string' ? value : JSON.stringify(value);
            lines.push(styleText('dim', `${key}: ${formatted}`));
        }
    }
    return lines;
}
function singleLine(message) {
    return message.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
}
export function formatLogEntry(log, verbose = false, previousLog) {
    const date = new Date(log.timestamp);
    const time = formatTime(date);
    const day = formatDate(date);
    const errorLog = isErrorLevel(log);
    // error/fatal auto-expand details; verbose expands everything
    const showDetails = verbose || errorLog;
    // only verbose swaps the compact gutter for a level label
    const useLevelGutter = verbose;
    const gutter = logGutter(log, useLevelGutter, previousLog);
    let line = `${day} ${time} ${gutter}${singleLine(log.message)}`;
    if (showDetails) {
        const timestampWidth = `${day} ${time} `.length;
        const gutterWidth = useLevelGutter ? GUTTER_LEVEL_WIDTH : GUTTER_SYMBOL_WIDTH;
        const pad = ' '.repeat(timestampWidth + gutterWidth);
        const detailLines = formatMetadataLines(log);
        // auto-expanded error/fatal: show the level above the metadata since the gutter is just a symbol
        if (errorLog && !verbose) {
            detailLines.unshift(`${styleText('dim', 'level:')} ${styleText(errorStyle, log.level.toUpperCase())}`);
        }
        for (const metaLine of detailLines) {
            line += `\n${pad}${metaLine}`;
        }
    }
    return line;
}
export function formatLogs(logs, verbose = false) {
    const sorted = [...logs].sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        const diff = aTime - bTime;
        if (diff !== 0)
            return diff;
        const aSeq = Number.parseInt(a.seq, 10);
        const bSeq = Number.parseInt(b.seq, 10);
        return aSeq - bSeq;
    });
    return sorted
        .map((log, i) => formatLogEntry(log, verbose, sorted[i - 1]))
        .join('\n');
}
