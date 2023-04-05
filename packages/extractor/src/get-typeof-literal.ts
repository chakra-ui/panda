import type { LiteralKind } from './box-factory'
import type { PrimitiveType } from './types'

export const getTypeOfLiteral = (value: PrimitiveType | PrimitiveType[]): LiteralKind => {
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  throw new Error(`Unexpected literal type: ${value as any}`)
}
