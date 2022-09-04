import { getBreakpointDetails } from '@css-panda/breakpoint-utils'
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
  rawValue: `@media ${value}`,
})

function parseBreakpoints(breakpoints: Record<string, string>): Record<string, RawCondition> {
  const details = getBreakpointDetails(breakpoints)
  const entries = Object.keys(breakpoints).flatMap((key) => [
    [key, breakpoint(key, details[key].minQuery)],
    [`${key}_only`, breakpoint(`${key}_only`, details[key].minMaxQuery)],
  ])
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
    // float non-condition values to the start
    shift(paths: string[]) {
      return paths.slice().sort((a, b) => {
        const aIsCondition = a in values
        const bIsCondition = b in values
        if (aIsCondition && !bIsCondition) return 1
        if (!aIsCondition && bIsCondition) return -1
        return 0
      })
    },
    is(key: string) {
      return Object.prototype.hasOwnProperty.call(values, key)
    },
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
