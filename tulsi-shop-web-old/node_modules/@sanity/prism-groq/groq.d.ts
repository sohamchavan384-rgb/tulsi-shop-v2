declare const groq: Record<string, unknown>
export default groq

/** Refractor/react-refractor compatible registration function. */
export declare const refractorGroq: ((prism: {
  languages: Record<string, unknown>
}) => void) & {displayName: string; aliases: string[]}
