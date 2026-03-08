import type { Conditions } from '@pandacss/types'
import type { AddError } from '../types'
import { isString } from '@pandacss/shared'

const validateSelector = (value: string, addError: AddError) => {
  if (!value.startsWith('@') && !value.includes('&')) {
    addError('conditions', `Selectors should contain the \`&\` character: \`${value}\``)
  }
}

export const validateConditions = (conditions: Conditions | undefined, addError: AddError) => {
  if (!conditions) return

  Object.values(conditions).forEach((condition) => {
    if (isString(condition)) {
      validateSelector(condition, addError)
      return
    }

    if (typeof condition === 'function') {
      try {
        const withArg = condition('item')
        if (typeof withArg !== 'string') {
          addError('conditions', `Dynamic condition function must return a string, got ${typeof withArg}`)
          return
        }
        validateSelector(withArg, addError)
      } catch (err) {
        addError('conditions', `Dynamic condition function threw: ${err instanceof Error ? err.message : String(err)}`)
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
