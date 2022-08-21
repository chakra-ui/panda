import outdent from 'outdent'
import { InternalContext } from '../create-context'

export function generateConditions({ context }: InternalContext) {
  const keys = Object.keys({ ...context.conditions, ...context.breakpoints }).concat('_', 'base')
  return outdent`
  export type Condition = ${keys.map((key) => JSON.stringify(key)).join(' | ')}
  export type Conditions = Record<Condition, string>
  `
}
