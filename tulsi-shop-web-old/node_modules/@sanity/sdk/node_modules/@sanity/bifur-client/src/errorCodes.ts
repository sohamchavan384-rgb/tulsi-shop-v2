/**
 * @public
 */
export const ERROR_CODES = {
  // Connection-level errors
  BAD_REQUEST: 4000,
  UNAUTHORIZED: 4001,
  NOT_FOUND: 4004,

  // Application-level errors
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  SUBSCRIPTION_NOT_FOUND: -32602,
  PARSE_ERROR: -32700,
} as const

/**
 * @public
 */
export type ERROR_CODES = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
