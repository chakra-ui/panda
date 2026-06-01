export type PandaErrorCode = 'CONFIG_NOT_FOUND' | 'CONFIG_ERROR'

export class PandaError extends Error {
  readonly code: string
  readonly hint?: string

  constructor(code: PandaErrorCode, message: string, opts?: { hint?: string; cause?: unknown }) {
    super(message, { cause: opts?.cause })
    this.code = `ERR_PANDA_${code}`
    this.hint = opts?.hint
  }
}
