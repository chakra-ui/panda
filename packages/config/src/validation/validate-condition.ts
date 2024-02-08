import type { Conditions } from '@pandacss/types'
import type { AddError } from '../types'

export const validateConditions = (conditions: Conditions | undefined, addError: AddError) => {
  if (!conditions) return

  Object.values(conditions).forEach((condition) => {
    if (!condition.startsWith('@') && !condition.includes('&')) {
      addError('conditions', `Selectors should contain the \`&\` character: \`${condition}\``)
    }
  })
}
