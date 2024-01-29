export type PandaErrorCode =
  | 'CONFIG_NOT_FOUND'
  | 'CONFIG_ERROR'
  | 'NOT_FOUND'
  | 'CONDITION'
  | 'MISSING_STUDIO'
  | 'INVALID_LAYER'
  | 'UNKNOWN_RECIPE'
  | 'INVALID_RECIPE'
  | 'UNKNOWN_TYPE'
  | 'MISSING_PARAMS'
  | 'NO_CONTEXT'
  | 'INVALID_TOKEN'

export class PandaError extends Error {
  readonly code: string
  readonly hint?: string

  constructor(code: PandaErrorCode, message: string, opts?: { hint?: string }) {
    super(message)
    this.code = `ERR_PANDA_${code}`
    this.hint = opts?.hint
  }
}
