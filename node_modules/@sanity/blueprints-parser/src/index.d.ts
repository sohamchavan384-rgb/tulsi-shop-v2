/** Scalar values */
export type Scalar = string | number

/** Input types the parser can accept */
export type BlueprintInput = string | Buffer | object

/** Options to control the parser */
export type ParserOptions = {
  debug?: boolean
  parameters?: Record<string, Scalar>
  invalidReferenceTypes?: Array<string>
}

/** The representation of a resource in the system. */
export type Resource = {
  name: string
  type: string
} & Record<string, unknown>

/** Parameters that can be passed in */
export type Parameter = {
  name: string
  type: 'arg' | 'argument' | 'env-var' | 'envVar' | 'config' | 'stdin'
} & (
  | {
      type: 'arg' | 'argument' | 'env-var' | 'envVar'
      input: string
    }
  | {
      type: 'config'
      settings?: Record<string, unknown>
    }
)

/** Output from the parser based on the blueprint's output values */
export type Output = {
  name: string
  value: string
}

/** The blueprint document */
export type Blueprint = {
  /** The version of the parser logic to use, use YYYY-MM-DD format */
  blueprintVersion?: string
  /** The list of resources to be managed by this blueprint */
  resources?: Array<Resource>
  /** Values that can be referenced in the blueprint */
  values?: Record<string, Scalar>
  /** Parameters that were provided from configuration or the environment */
  parameters?: Array<Parameter>
  /** A list of values to be returned when the blueprint is deployed */
  outputs?: Array<Output>
  /** Extra data that is not used by the parser */
  metadata?: Record<string, unknown>
}

/** Errors that the parser might return */
export type ParserError = {
  message: string
} & (
  | {
      type: 'json_validation_error'
      error: unknown
    }
  | {
      type: 'invalid_input'
    }
)
/** The return type of the internal parser */
export type ParserOuput =
  | {
      ok: true
      rawBlueprint: Record<string, unknown>
    }
  | {
      ok: false
      parseErrors: Array<ParserError>
    }

/** An error that occurred during validation */
export type ValidationError = {
  type: string
  message: string
}

/** Where a reference points, or where it was found */
export type ReferenceEndpoint = {
  /** The top-level collection, e.g. `resources`, `values`, `outputs` */
  collection: string
  /** The name of the item within that collection */
  name: string
  /** The path within that item, empty when the reference is to the item itself */
  path: string
}

/** The location and content of a reference */
export type ReferenceLocation = {
  /** The location where the reference was found */
  path: string
  /** The content of the reference (e.g. $.resources.project-1.id) */
  ref: string
}

/** A reference that could not be resolved during parsing */
export type UnresolvedReference = ReferenceLocation & {
  /** `ref` in split form: where the value will come from */
  source: ReferenceEndpoint
  /** `path` in split form: where the value belongs */
  target: ReferenceEndpoint
}

/** A reference found during parsing */
export type Reference = ReferenceLocation & {
  /** The object or array containing the reference */
  container: object | Array
  /** The key or index of the reference in the container */
  property: string | number
}

/** An error with the use of a reference */
export type ReferenceError = {
  type: string
  message: string
}

/** A union of all error types */
export type BlueprintError = ParserError | ValidationError | ReferenceError

/** The output of the parser */
export type BlueprintOutput =
  | {
      result: 'valid'
      blueprint: Blueprint
      unresolvedRefs?: Array<UnresolvedReference>
    }
  | {
      result: 'reference_errors'
      blueprint: Blueprint
      unresolvedRefs?: Array<UnresolvedReference>
      errors: Array<ReferenceError>
    }
  | {
      result: 'parse_errors'
      errors: Array<ParserError>
    }
  | {
      result: 'validation_errors'
      errors: Array<ValidationError>
    }

/**
 * Parses the given document and returns any error found, or the parsed and partially resolved document.
 * @param input The document to be parsed
 * @param options Options to control the parser
 */
export default function blueprintParserValidator(
  input: BlueprintInput,
  options: ParserOptions = {},
): BlueprintOutput

declare module '@sanity/blueprints-parser' {
  export default blueprintParserValidator
}
