import { ConditionError } from '@css-panda/error'
import { splitBy } from '@css-panda/shared'
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
  if (splitBy(condition, ',').length > 1) {
    throw new ConditionError('Multiple css conditions are not allowed')
  }

  if (condition.startsWith('@')) {
    return parseAtRule(condition)
  }

  let type: RawCondition['type'] | undefined

  if (condition.startsWith('&')) {
    type = 'self-nesting'
  } else if (condition.endsWith(' &')) {
    type = 'parent-nesting'
  } else if (condition.includes('&')) {
    type = 'combinator-nesting'
  }

  if (type) {
    return { type, value: condition, raw: condition }
  }

  throw new ConditionError('Invalid css condition or selector')
}
