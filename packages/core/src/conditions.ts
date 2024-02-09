import { logger } from '@pandacss/logger'
import { isBaseCondition, toRem, withoutSpace } from '@pandacss/shared'
import type { ConditionDetails, ConditionType, Conditions as ConditionsConfig } from '@pandacss/types'
import { Breakpoints } from './breakpoints'
import { parseCondition } from './parse-condition'

const order: ConditionType[] = ['self-nesting', 'combinator-nesting', 'parent-nesting', 'at-rule']

interface Options {
  conditions?: ConditionsConfig
  breakpoints?: Record<string, string>
  containerNames?: string[]
  containerSizes?: Record<string, string>
}

const underscoreRegex = /^_/
const selectorRegex = /&|@/

export class Conditions {
  values: Record<string, ConditionDetails>

  breakpoints: Breakpoints

  constructor(private options: Options) {
    const { breakpoints: breakpointValues = {}, conditions = {} } = options

    const breakpoints = new Breakpoints(breakpointValues)
    this.breakpoints = breakpoints

    const entries = Object.entries(conditions).map(([key, value]) => [`_${key}`, parseCondition(value)])

    const containers = this.setupContainers()

    this.values = {
      ...Object.fromEntries(entries),
      ...breakpoints.conditions,
      ...containers,
    }
  }

  private setupContainers = () => {
    const { containerNames = [], containerSizes = {} } = this.options

    const containers: Record<string, ConditionDetails> = {}
    containerNames.unshift('') // add empty container name for @/sm, @/md, etc.

    containerNames.forEach((name) => {
      Object.entries(containerSizes).forEach(([size, value]) => {
        const _value = toRem(value) ?? value
        containers[`@${name}/${size}`] = {
          type: 'at-rule',
          name: 'container',
          value: _value,
          raw: `@container ${name} (min-width: ${_value})`,
          params: `${name} ${value}`,
        }
      })
    })

    return containers
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
    const details = this.values[key]
    return details.raw
  }

  getRaw = (conditionName: string): ConditionDetails | undefined => {
    try {
      return this.values[conditionName] ?? parseCondition(conditionName)
    } catch (error) {
      logger.error('core:condition', error)
    }
  }

  sort = (conditions: string[]): ConditionDetails[] => {
    const rawConditions = conditions.map(this.getRaw).filter(Boolean) as ConditionDetails[]
    return rawConditions.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
  }

  normalize = (condition: string | ConditionDetails): ConditionDetails | undefined => {
    return typeof condition === 'string' ? this.getRaw(condition) : condition
  }

  keys = () => {
    return Object.keys(this.values)
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
