import type { Conditions } from '@pandacss/types'
import type { AddError } from '../types'
import { isString } from '@pandacss/shared'

export const validateConditions = (conditions: Conditions | undefined, addError: AddError) => {
  if (!conditions) return

  Object.values(conditions).forEach((condition) => {
    if (isString(condition)) {
      if (!condition.startsWith('@') && !condition.includes('&')) {
        addError('conditions', `Selectors should contain the \`&\` character: \`${condition}\``)
      }

      return
    }

    condition.forEach((c) => {
      if (!c.startsWith('@') && !c.includes('&')) {
        addError('conditions', `Selectors should contain the \`&\` character: \`${c}\``)
      }
    })
  })
}
