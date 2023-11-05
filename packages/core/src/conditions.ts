import { logger } from '@pandacss/logger'
import { isBaseCondition, withoutSpace } from '@pandacss/shared'
import type { ConditionType, Dict, RawCondition } from '@pandacss/types'
import { Breakpoints } from './breakpoints'
import { ConditionalRule } from './conditional-rule'
import { parseCondition } from './parse-condition'

const order: ConditionType[] = ['self-nesting', 'combinator-nesting', 'parent-nesting', 'at-rule']

interface Options {
  conditions?: Dict<string>
  breakpoints?: Record<string, string>
}

const underscoreRegex = /^_/
const selectorRegex = /&|@/

export class Conditions {
  values: Record<string, RawCondition>

  breakpoints: Breakpoints

  constructor(private options: Options) {
    const { breakpoints: breakpointValues = {}, conditions = {} } = this.options
    const breakpoints = new Breakpoints(breakpointValues)
    this.breakpoints = breakpoints

    const entries = Object.entries(conditions).map(([key, value]) => [`_${key}`, parseCondition(value)])

    this.values = {
      ...Object.fromEntries(entries),
      ...breakpoints.conditions,
    }
  }

  finalize = (paths: string[]) => {
    return paths.map((path) => {
      if (this.has(path)) {
        return path.replace(underscoreRegex, '')
      }

      if (selectorRegex.test(path)) {
        return `[${withoutSpace(path.trim())}]`
      }

      return path
    })
  }

  shift = (paths: string[]) => {
    return paths
      .map((path) => path.trim())
      .sort((a, b) => {
        const aIsCondition = this.isCondition(a)
        const bIsCondition = this.isCondition(b)
        if (aIsCondition && !bIsCondition) return 1
        if (!aIsCondition && bIsCondition) return -1
        if (!aIsCondition && !bIsCondition) return -1
        return 0
      })
  }

  segment = (paths: string[]): { condition: string[]; selector: string[] } => {
    const condition: string[] = []
    const selector: string[] = []

    for (const path of paths) {
      if (this.isCondition(path)) {
        condition.push(path)
      } else {
        selector.push(path)
      }
    }

    return { condition, selector }
  }

  has = (key: string) => {
    return Object.prototype.hasOwnProperty.call(this.values, key)
  }

  isCondition = (key: string) => {
    return this.has(key) || !!this.getRaw(key) || isBaseCondition(key)
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
      logger.error('core:condition', error)
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

  saveOne = (key: string, value: string) => {
    const parsed = parseCondition(value)
    if (!parsed) return

    this.values[`_${key}`] = parsed
  }

  remove(key: string) {
    delete this.values[`_${key}`]
  }
}
