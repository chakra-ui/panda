import { BaseCondition, BaseConditionType, Condition, Conditions } from '@css-panda/types'
import postcss, { AtRule } from 'postcss'
import { match, P } from 'ts-pattern'

type RawCondition = BaseCondition & { raw: string }
type MixedCondition = Condition | string

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

  constructor(conditions: Conditions) {
    for (const [key, value] of Object.entries(conditions)) {
      this.record.set(key, this.normalize(value))
    }
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

    throw new Error('Invalid condition: ' + condition)
  }

  normalize(condition: MixedCondition): RawCondition {
    return match<MixedCondition, RawCondition>(condition)
      .with(P.string, (value) => {
        return value.startsWith('@') ? parseAtRule(value) : this.parse(value)
      })
      .with({ type: 'color-scheme' }, (cond) => {
        const type = cond.value.startsWith('@') ? 'at-rule' : 'parent-nesting'
        return { ...cond, type, raw: cond.value }
      })
      .with({ type: 'screen' }, (cond) => {
        return { ...cond, type: 'at-rule', name: 'screen', raw: cond.value }
      })
      .otherwise((cond: any) => {
        return { ...cond, raw: cond.value }
      })
  }

  addBreakpoints(breakpoints: Record<string, string>) {
    for (const [key, value] of Object.entries(breakpoints)) {
      const cond: Condition = {
        type: 'screen',
        value: key,
        rawValue: `@media screen and (min-width: ${value})`,
      }
      this.record.set(key, this.normalize(cond))
    }
    return this
  }
}
