import { logger } from '@css-panda/logger'
import type { BaseConditionType, Dict, RawCondition } from '@css-panda/types'
import { Breakpoints } from './breakpoints'
import { ConditionalRule } from './conditional-rule'
import { parseCondition } from './parse-condition'

const order: BaseConditionType[] = ['self-nesting', 'combinator-nesting', 'parent-nesting', 'at-rule']

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
    return paths.slice().sort((a, b) => {
      const aIsCondition = this.isCondition(a)
      const bIsCondition = this.isCondition(b)
      if (aIsCondition && !bIsCondition) return 1
      if (!aIsCondition && bIsCondition) return -1
      return 0
    })
  }

  has = (key: string) => {
    return Object.prototype.hasOwnProperty.call(this.values, key)
  }

  isCondition = (key: string) => {
    return this.has(key) || !!this.getRaw(key)
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

  rule = () => {
    return new ConditionalRule(this)
  }
}
