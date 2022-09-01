import { BaseCondition, BaseConditionType, Conditions } from '@css-panda/types'
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

export class CSSCondition {
  private record: Map<string, RawCondition> = new Map()
  values: Set<RawCondition> = new Set()

  constructor(private options: { conditions: Conditions; breakpoints?: Record<string, string> }) {
    const { conditions, breakpoints = {} } = this.options

    for (const [key, value] of Object.entries(conditions)) {
      this.record.set(key, this.normalize(value))
    }

    this.addBreakpoints(breakpoints)
  }

  clone() {
    return new CSSCondition(this.options)
  }

  resolve(conditions: string[]) {
    for (const condition of conditions) {
      let rawCondition = this.record.get(condition)
      if (!rawCondition) {
        rawCondition = this.normalize(condition)
        this.record.set(condition, rawCondition)
      }
      this.values.add(rawCondition)
    }
    return this.sort()
  }

  private sort() {
    const sortedConditions = Array.from(this.values).sort((a, b) => {
      const aIndex = order.indexOf(a.type)
      const bIndex = order.indexOf(b.type)
      return aIndex - bIndex
    })
    this.values = new Set(sortedConditions)
    return this.values
  }

  private parse(condition: string): RawCondition {
    if (condition.includes('&')) {
      return { type: condition.startsWith('&') ? 'self-nesting' : 'parent-nesting', value: condition, raw: condition }
    }

    if (condition.startsWith('@')) {
      return parseAtRule(condition)
    }

    if (this.record.has(condition)) {
      return this.record.get(condition)!
    }

    throw new Error('Invalid condition: ' + condition)
  }

  normalize(condition: string): RawCondition {
    return condition.startsWith('@') ? parseAtRule(condition) : this.parse(condition)
  }

  addBreakpoints(breakpoints: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(breakpoints)) {
      const cond: RawCondition = {
        type: 'at-rule',
        name: 'screen',
        value: key,
        raw: key,
        rawValue: `@media screen and (min-width: ${value})`,
      }
      this.record.set(key, cond)
    }
    return this
  }
}
