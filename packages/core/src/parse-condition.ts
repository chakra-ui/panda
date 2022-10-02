import { ConditionError } from '@css-panda/error'
import type { RawCondition } from '@css-panda/types'
import postcss, { AtRule } from 'postcss'

function parseAtRule(value: string): RawCondition {
  const result = postcss.parse(value)
  const rule = result.nodes[0] as AtRule
  return {
    type: 'at-rule',
    name: rule.name,
    value: rule.params,
    raw: value,
  }
}

export function parseCondition(condition: string): RawCondition {
  if (condition.startsWith('@')) {
    return parseAtRule(condition)
  }

  if (condition.includes('&')) {
    return {
      type: condition.startsWith('&') ? 'self-nesting' : 'parent-nesting',
      value: condition,
      raw: condition,
    }
  }

  throw new ConditionError('Invalid condition. Did you forget to add the conditions in your panda config?')
}
