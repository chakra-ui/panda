import { unionType } from '@css-panda/shared'
import outdent from 'outdent'
import type { Context } from '../create-context'

export function generateConditions({ context }: Context) {
  const ctx = context()
  const keys = Object.keys(ctx.conditions.values).concat('_', 'base')
  return outdent`
  export type Condition = ${unionType(keys)}
  export type Conditions = Record<Condition, string>
  `
}
