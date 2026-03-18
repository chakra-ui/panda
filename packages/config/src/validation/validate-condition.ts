import type { Conditions, ConditionObjectQuery } from '@pandacss/types'
import type { AddError } from '../types'
import { isString } from '@pandacss/shared'

const validateObjectCondition = (obj: ConditionObjectQuery, addError: AddError) => {
  for (const [key, value] of Object.entries(obj)) {
    if (!key.startsWith('@') && !key.includes('&')) {
      addError('conditions', `Selectors should contain the \`&\` character: \`${key}\``)
    }
    if (value === '@slot') continue
    if (typeof value === 'object' && value !== null) {
      validateObjectCondition(value, addError)
    }
  }
}

export const validateConditions = (conditions: Conditions | undefined, addError: AddError) => {
  if (!conditions) return

  Object.values(conditions).forEach((condition) => {
    if (isString(condition)) {
      if (!condition.startsWith('@') && !condition.includes('&')) {
        addError('conditions', `Selectors should contain the \`&\` character: \`${condition}\``)
      }

      return
    }

    if (Array.isArray(condition)) {
      condition.forEach((c) => {
        if (!c.startsWith('@') && !c.includes('&')) {
          addError('conditions', `Selectors should contain the \`&\` character: \`${c}\``)
        }
      })

      return
    }

    // Object syntax with @slot markers
    validateObjectCondition(condition, addError)
  })
}
