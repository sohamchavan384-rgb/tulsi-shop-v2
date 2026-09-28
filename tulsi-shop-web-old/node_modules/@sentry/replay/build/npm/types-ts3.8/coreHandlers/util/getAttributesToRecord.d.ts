/**
 * Attributes that can end up in a click breadcrumb. This is `ATTRIBUTES_TO_RECORD` plus
 * `data-sentry-element`, which is not recorded itself but is used as a fallback for
 * `data-sentry-component`.
 */
export declare const BREADCRUMB_RELEVANT_ATTRIBUTES: Set<string>;
/**
 * Inclusion list of attributes that we want to record from the DOM element
 */
export declare function getAttributesToRecord(attributes: Record<string, unknown>): Record<string, unknown>;
//# sourceMappingURL=getAttributesToRecord.d.ts.map
