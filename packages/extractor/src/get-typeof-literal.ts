import type { LiteralKind } from './box-factory'
import type { PrimitiveType } from './types'

export const getTypeOfLiteral = (value: PrimitiveType | PrimitiveType[]): LiteralKind => {
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  throw new PandaError('UNKNOWN_TYPE', `Unexpected literal type: ${value as any}`)
}

// inlining here to avoid circular dependencies
// packages/shared/src/error.ts
class PandaError extends Error {
  readonly code: string
  readonly hint?: string

  constructor(code: string, message: string, opts?: { hint?: string }) {
    super(message)
    this.code = `ERR_PANDA_${code}`
    this.hint = opts?.hint
  }
}
