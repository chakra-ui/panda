import { logger } from '@pandacss/logger'
import { capitalize, isBaseCondition, isObject, toRem, withoutSpace } from '@pandacss/shared'
import type {
  ConditionDetails,
  ConditionQuery,
  ConditionType,
  Conditions as ConditionsConfig,
  ThemeVariantsMap,
} from '@pandacss/types'
import { Breakpoints } from './breakpoints'
import { parseCondition } from './parse-condition'
import { compareAtRuleOrMixed } from './sort-style-rules'

const order: ConditionType[] = ['at-rule', 'self-nesting', 'combinator-nesting', 'parent-nesting']

interface Options {
  conditions?: ConditionsConfig
  breakpoints?: Record<string, string>
  containerNames?: string[]
  containerSizes?: Record<string, string>
  themes?: ThemeVariantsMap
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
    const themes = this.setupThemes()

    this.values = {
      ...Object.fromEntries(entries),
      ...breakpoints.conditions,
      ...containers,
      ...themes,
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

  private setupThemes = () => {
    const { themes = {} } = this.options

    const themeVariants: Record<string, ConditionDetails> = {}
    Object.entries(themes).forEach(([theme, themeVariant]) => {
      const condName = '_theme' + capitalize(theme)
      const cond = parseCondition('& ' + themeVariant.selector)
      if (!cond) return

      themeVariants[condName] = cond
    })

    return themeVariants
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

  get = (key: string): undefined | string | string[] => {
    const details = this.values[key]
    return details?.raw
  }

  getRaw = (condNameOrQuery: ConditionQuery): ConditionDetails | undefined => {
    if (typeof condNameOrQuery === 'string' && this.values[condNameOrQuery]) return this.values[condNameOrQuery]

    try {
      return parseCondition(condNameOrQuery)
    } catch (error) {
      logger.error('core:condition', error)
    }
  }

  sort = (conditions: string[]): ConditionDetails[] => {
    const rawConditions = conditions.map(this.getRaw).filter(Boolean) as ConditionDetails[]
    return rawConditions.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
  }

  normalize = (condition: ConditionQuery | ConditionDetails): ConditionDetails | undefined => {
    return isObject(condition) ? (condition as ConditionDetails) : this.getRaw(condition)
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

  getSortedKeys = () => {
    return Object.keys(this.values).sort((a, b) => {
      const aCondition = this.values[a]
      const bCondition = this.values[b]

      const score = compareAtRuleOrMixed(
        { entry: {} as any, conditions: [aCondition] },
        { entry: {} as any, conditions: [bCondition] },
      )
      return score
    })
  }
}
