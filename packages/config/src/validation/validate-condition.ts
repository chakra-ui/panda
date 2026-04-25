import type { Conditions, ConditionObjectQuery } from '@pandacss/types'
import type { AddError } from '../types'
import { isString } from '@pandacss/shared'

const validateObjectCondition = (obj: ConditionObjectQuery, addError: AddError): { hasSlot: boolean } => {
  let hasSlot = false
  for (const [key, value] of Object.entries(obj)) {
    if (!key.startsWith('@') && !key.includes('&')) {
      addError('conditions', `Selectors should contain the \`&\` character: \`${key}\``)
    }
    if (value === '@slot') {
      hasSlot = true
      continue
    }
    if (typeof value === 'string') {
      addError(
        'conditions',
        `Object condition leaves must be the literal string \`'@slot'\`, got \`${JSON.stringify(value)}\` at \`${key}\``,
      )
      continue
    }
    if (typeof value === 'object' && value !== null) {
      const nested = validateObjectCondition(value, addError)
      if (nested.hasSlot) hasSlot = true
    }
  }
  return { hasSlot }
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
    const { hasSlot } = validateObjectCondition(condition, addError)
    if (!hasSlot) {
      addError('conditions', `Object conditions must contain at least one \`'@slot'\` marker`)
    }
  })
}
