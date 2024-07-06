import { logger } from '@pandacss/logger'
import { PandaError, capitalize, isBaseCondition, isObject, toRem, withoutSpace } from '@pandacss/shared'
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

  conditionsRegex: RegExp | null

  constructor(private options: Options) {
    const { breakpoints: breakpointValues = {}, conditions = {} } = options

    const breakpoints = new Breakpoints(breakpointValues)
    this.breakpoints = breakpoints

    const entries = Object.entries(conditions).map(
      ([key, value]) => [`_${key}`, parseCondition(value)] as [string, ConditionDetails],
    )

    const containers = this.setupContainers()
    const themes = this.setupThemes()

    this.values = {
      ...Object.fromEntries(entries),
      ...breakpoints.conditions,
      ...containers,
      ...themes,
    }

    const simpleConditionNames = entries
      .filter(([key, details]) => key.startsWith('_') && details.type !== 'mixed')
      .map(([key]) => key)
    this.conditionsRegex = simpleConditionNames.length ? new RegExp(`(${simpleConditionNames.join('|')})`, 'g') : null
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
    Object.entries(themes).forEach(([theme, _themeVariant]) => {
      const condName = this.getThemeName(theme)
      const cond = parseCondition('& ' + this.getThemeSelector(theme))
      if (!cond) return

      themeVariants[condName] = cond
    })

    return themeVariants
  }

  getThemeSelector = (name: string) => {
    return `[data-panda-theme=${name}]`
  }

  getThemeName = (theme: string) => {
    return '_theme' + capitalize(theme)
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
    return this.has(key) || !!this.getRaw(key) || isBaseCondition(key) || this.hasKnownCondition(key)
  }

  hasKnownCondition = (key: string) => {
    return this.conditionsRegex?.test(key) ?? false
  }

  resolveKnownConditionsJIT = (key: string) => {
    if (!this.conditionsRegex || !this.hasKnownCondition(key)) return key

    return key.replace(this.conditionsRegex, (match) => {
      const cond = this.values[match]
      if (!cond) return match

      if (Array.isArray(cond.raw)) {
        throw new PandaError(
          'CONDITION',
          `Cannot use mixed condition reference in JIT condition "${cond.raw.join(', ')}"`,
        )
      }

      return cond.raw
    })
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
    const rawConditions = conditions
      .map((cond) => {
        if (this.has(cond)) return this.getRaw(cond)
        return this.getRaw(this.resolveKnownConditionsJIT(cond))
      })
      .filter(Boolean) as ConditionDetails[]
    return rawConditions.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
  }

  normalize = (condition: ConditionQuery | ConditionDetails): ConditionDetails | undefined => {
    if (isObject(condition)) return condition as ConditionDetails

    if (this.has(condition) || Array.isArray(condition)) return this.getRaw(condition)
    return this.getRaw(this.resolveKnownConditionsJIT(condition))
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
