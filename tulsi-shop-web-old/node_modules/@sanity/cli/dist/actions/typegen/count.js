export const count = (amount, plural = '', singular = plural.slice(0, Math.max(0, plural.length - 1)))=>[
        amount.toLocaleString('en-US'),
        amount === 1 ? singular : plural
    ].filter(Boolean).join(' ');

//# sourceMappingURL=count.js.map