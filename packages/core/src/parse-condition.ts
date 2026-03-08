import type {
  AtRuleCondition,
  ConditionDetails,
  ConditionQuery,
  MixedCondition,
  SelectorCondition,
} from '@pandacss/types'
import { AtRule } from 'postcss'
import { safeParse } from './safe-parse'

function parseAtRule(value: string): AtRuleCondition {
  // TODO this creates a new postcss.root for each media query !
  const result = safeParse(value)
  const rule = result.nodes[0] as AtRule
  return {
    type: 'at-rule',
    name: rule.name,
    value: rule.params,
    raw: value,
    params: rule.params,
  }
}

export function parseCondition(condition: ConditionQuery): ConditionDetails | undefined {
  if (Array.isArray(condition)) {
    return {
      type: 'mixed',
      raw: condition,
      value: condition.map(parseCondition),
    } as MixedCondition
  }

  if (typeof condition === 'function') {
    return undefined
  }

  if (condition.startsWith('@')) {
    return parseAtRule(condition)
  }

  let type: ConditionDetails['type'] | undefined

  if (condition.startsWith('&')) {
    type = 'self-nesting'
  } else if (condition.endsWith(' &')) {
    type = 'parent-nesting'
  } else if (condition.includes('&')) {
    type = 'combinator-nesting'
  }

  if (type) {
    return { type, value: condition, raw: condition } as SelectorCondition
  }
}
