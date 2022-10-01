import { ConditionError } from '@css-panda/error'
import { logger } from '@css-panda/logger'
import type { BaseConditionType, Dict, RawCondition } from '@css-panda/types'
import postcss, { AtRule } from 'postcss'
import { Breakpoints } from './breakpoints'

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

  throw new ConditionError('Invalid condition. Did you forget to add the conditions in your panda config?')
}

type Options = {
  conditions: Dict<string>
  breakpoints?: Record<string, string>
}

export class Conditions {
  values: Record<string, RawCondition>

  constructor(private options: Options) {
    const { breakpoints = {}, conditions } = this.options
    const instance = new Breakpoints(breakpoints)

    const entries = Object.entries(conditions).map(([key, value]) => [key, parseCondition(value)])

    this.values = {
      ...Object.fromEntries(entries),
      ...instance.conditions,
    }
  }

  shift = (paths: string[]) => {
    const values = this.values
    return paths.slice().sort((a, b) => {
      const aIsCondition = a in values
      const bIsCondition = b in values
      if (aIsCondition && !bIsCondition) return 1
      if (!aIsCondition && bIsCondition) return -1
      return 0
    })
  }

  has = (key: string) => {
    return Object.prototype.hasOwnProperty.call(this.values, key)
  }

  isEmpty = () => {
    return Object.keys(this.values).length === 0
  }

  get = (key: string) => {
    const result = this.values[key]
    return result?.rawValue ?? result?.value
  }

  getRaw = (condition: string): RawCondition | undefined => {
    try {
      return this.values[condition] ?? parseCondition(condition)
    } catch (error) {
      logger.error({ err: error })
    }
  }

  sort = (conditions: string[]): RawCondition[] => {
    const rawConditions = conditions.map(this.getRaw).filter(Boolean) as RawCondition[]
    return rawConditions.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
  }

  normalize = (condition: string | RawCondition): RawCondition | undefined => {
    return typeof condition === 'string' ? this.getRaw(condition) : condition
  }

  keys = () => {
    return Object.keys(this.values)
  }
}
