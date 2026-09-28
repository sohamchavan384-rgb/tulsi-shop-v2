import { isatty } from 'node:tty';
import { logSymbols } from '@sanity/cli-core/ux';
export const isTty = isatty(1);
export const levelValues = {
    error: 0,
    info: 2,
    warning: 1
};
/**
 * Generates a formatted string that includes a numerical amount and a subject
 * in plural or singular form. Note: the subject must end in `s`
 */ export const count = (amount, subject)=>`${amount.toLocaleString('en-US')} ${amount === 1 ? subject.slice(0, Math.max(0, subject.length - 1)) : subject}`;
const percentageFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    style: 'percent'
});
/**
 * Given a decimal, this will return that number formatted as a percentage
 */ export const percent = (value)=>percentageFormatter.format(Math.min(value, 1));
const secondFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
});
/**
 * Given a start time in milliseconds, this will output the time elapsed
 * formatted in seconds
 */ export const seconds = (startTime)=>{
    const endTime = Date.now();
    return `(${secondFormatter.format((endTime - startTime) / 1000)}s)`;
};
/**
 * Outputs summary text given an object of totals. Omits totals depending on the
 * desired validation `level`
 */ export const summary = ({ errors, infos, valid, warnings }, level = 'warning')=>{
    const levelValue = levelValues[level];
    return [
        `${logSymbols.success} Valid:    ${count(valid.documents, 'documents')}`,
        `${logSymbols.error} Errors:   ${count(errors.documents, 'documents')}, ${count(errors.markers, 'errors')}`,
        levelValue >= levelValues.warning && `${logSymbols.warning} Warnings: ${count(warnings.documents, 'documents')}, ${count(warnings.markers, 'warnings')}`,
        levelValue >= levelValues.info && `${logSymbols.info} Info:     ${count(infos.documents, 'documents')}, ${count(infos.documents, 'markers')}`
    ].filter(Boolean).join('\n');
};

//# sourceMappingURL=util.js.map