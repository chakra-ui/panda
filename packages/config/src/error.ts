import type { Diagnostic } from '@pandacss/compiler-shared'

export type PandaErrorCode = 'CONFIG_NOT_FOUND' | 'CONFIG_ERROR'

export class PandaError extends Error {
  readonly code: string
  readonly hint?: string
  readonly diagnostics?: Diagnostic[]

  constructor(
    code: PandaErrorCode,
    message: string,
    opts?: { hint?: string; cause?: unknown; diagnostics?: Diagnostic[] },
  ) {
    super(message, { cause: opts?.cause })
    this.code = `ERR_PANDA_${code}`
    this.hint = opts?.hint
    this.diagnostics = opts?.diagnostics
  }
}

export function createConfigError(message: string, diagnostics?: Diagnostic[]): PandaError {
  return new PandaError('CONFIG_ERROR', `💥 ${message}`, { diagnostics })
}

export function createConfigDiagnostic(code: string, message: string, help?: string[]): Diagnostic {
  return {
    code,
    message,
    severity: 'error',
    category: 'config',
    ...(help ? { help } : {}),
  }
}
