/** Excludes `null` and `undefined` from a type. */ /**
 * Filter a union of object types by the _type property. This is handy when working with page builder
 * setups where the returned type is an array containing multiple types.
 *
 * @example
 * ```ts
 *
 * export type Callout = {
 *   _type: 'callout'
 *   title?: string
 *   content?: string
 * }
 *
 * export type Video = {
 *   _type: 'video'
 *   url?: string
 *   caption?: string
 * }
 * type FORM_QUERY_RESULT = {
 *   _id: string
 *   title?: string
 *   content?: Array<
 *     | ({ _key: string } & Callout)
 *     | ({ _key: string } & Video)
 *   >
 * } | null
 *
 * // Get the type of the content with the Get helper
 * type Content = Get<FORM_QUERY_RESULT, 'content', number>
 *
 * // Get the type for a callout module from the page builder type
 * type CalloutModule = FilterByType<Content, 'callout'>
 * // → { _key: string } & Callout
 * ```
 * @public
 */ export { };

//# sourceMappingURL=typeUtils.js.map