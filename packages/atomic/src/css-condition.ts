import type { BaseCondition, BaseConditionType, Conditions } from '@css-panda/types'
import postcss, { AtRule } from 'postcss'

type RawCondition = BaseCondition & { raw: string }

const order: BaseConditionType[] = ['self-nesting', 'parent-nesting', 'at-rule']

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

function parseCondition(condition: string): RawCondition {
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

  throw new Error('Invalid condition: ' + condition)
}

const breakpoint = (key: string, value: string) => ({
  type: 'at-rule',
  name: 'screen',
  value: key,
  raw: key,
  rawValue: `@media screen and (min-width: ${value})`,
})

function parseBreakpoints(breakpoints: Record<string, string>): Record<string, RawCondition> {
  const entries = Object.entries(breakpoints).map(([key, value]) => [key, breakpoint(key, value)])
  return Object.fromEntries(entries)
}

export function createConditions(options: { conditions: Conditions; breakpoints?: Record<string, string> }) {
  const { conditions, breakpoints = {} } = options

  // conditions
  const entries = Object.entries(conditions).map(([key, value]) => [key, parseCondition(value)])
  const conditionEntries = Object.fromEntries(entries)

  // breakpoints
  const breakpointEntries = parseBreakpoints(breakpoints)

  const values: Record<string, RawCondition> = {
    ...conditionEntries,
    ...breakpointEntries,
  }

  return {
    values,
    get(condition: string): RawCondition {
      return values[condition] ?? parseCondition(condition)
    },
    sort(conditions: string[]): RawCondition[] {
      const rawConditions = conditions.map(this.get)
      return rawConditions.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
    },
    normalize(condition: string | RawCondition): RawCondition {
      return typeof condition === 'string' ? this.get(condition) : condition
    },
  }
}

export type CSSCondition = ReturnType<typeof createConditions>
