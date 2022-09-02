import outdent from 'outdent'
import type { InternalContext } from '../create-context'

export function generateConditions({ context }: InternalContext) {
  const ctx = context()
  const keys = Object.keys({ ...ctx.conditions, ...ctx.breakpoints }).concat('_', 'base')
  return outdent`
  export type Condition = ${keys.map((key) => JSON.stringify(key)).join(' | ')}
  export type Conditions = Record<Condition, string>
  `
}
