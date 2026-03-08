import { logger } from '@pandacss/logger'
import { capitalize, isBaseCondition, isObject, toRem, withoutSpace } from '@pandacss/shared'
import type {
  ConditionDetails,
  ConditionQuery,
  Conditions as ConditionsConfig,
  DynamicConditionFn,
  ThemeVariantsMap,
} from '@pandacss/types'
import { Breakpoints } from './breakpoints'
import { parseCondition } from './parse-condition'
import { compareAtRuleOrMixed } from './sort-style-rules'

/**
 * Checks if a condition is an at-rule type
 */
const isAtRule = (cond: ConditionDetails): boolean => cond.type === 'at-rule'

/**
 * Flattens a condition, extracting parts from mixed conditions.
 * Returns an array of { condition, originalIndex } to track source order.
 */
const flattenCondition = (
  cond: ConditionDetails,
  originalIndex: number,
): Array<{ cond: ConditionDetails; originalIndex: number }> => {
  if (cond.type === 'mixed') {
    // Extract parts from mixed condition, each inherits the original index
    const parts = cond.value as ConditionDetails[]
    return parts.map((part) => ({ cond: part, originalIndex }))
  }
  return [{ cond, originalIndex }]
}

interface Options {
  conditions?: ConditionsConfig
  breakpoints?: Record<string, string>
  containerNames?: string[]
  containerSizes?: Record<string, string>
  themes?: ThemeVariantsMap
}

const underscoreRegex = /^_/
const selectorRegex = /&|@/

/** Parse _base or _base/arg into [baseName, arg]. */
function parseDynamicKey(key: string): [string, string | undefined] | null {
  if (!key.startsWith('_')) return null
  const rest = key.slice(1)
  const i = rest.indexOf('/')
  if (i === -1) return [rest, undefined]
  return [rest.slice(0, i), rest.slice(i + 1)]
}

export class Conditions {
  values: Record<string, ConditionDetails>
  dynamicConditions: Record<string, DynamicConditionFn>
  private dynamicCache = new Map<string, ConditionDetails>()

  breakpoints: Breakpoints

  constructor(private options: Options) {
    const { breakpoints: breakpointValues = {}, conditions = {} } = options

    const breakpoints = new Breakpoints(breakpointValues)
    this.breakpoints = breakpoints

    const staticEntries: [string, ConditionDetails][] = []
    const dynamicConditions: Record<string, DynamicConditionFn> = {}

    for (const [key, value] of Object.entries(conditions)) {
      if (typeof value === 'function') {
        dynamicConditions[key] = value as DynamicConditionFn
      } else {
        const parsed = parseCondition(value as string | string[])
        if (parsed) staticEntries.push([`_${key}`, parsed])
      }
    }

    this.dynamicConditions = dynamicConditions

    const containers = this.setupContainers()
    const themes = this.setupThemes()

    this.values = {
      ...Object.fromEntries(staticEntries),
      ...breakpoints.conditions,
      ...containers,
      ...themes,
    }
  }

  getDynamicConditionNames = (): string[] => {
    return Object.keys(this.dynamicConditions)
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
      const cond = parseCondition(this.getThemeSelector(theme) + ' &')
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
    if (Object.prototype.hasOwnProperty.call(this.values, key)) return true
    const parsed = parseDynamicKey(key)
    if (!parsed) return false
    const [base] = parsed
    return Object.prototype.hasOwnProperty.call(this.dynamicConditions, base)
  }

  isCondition = (key: string) => {
    return this.has(key) || !!this.getRaw(key) || isBaseCondition(key)
  }

  isEmpty = () => {
    return Object.keys(this.values).length === 0
  }

  get = (key: string): undefined | string | string[] => {
    const details = this.values[key]
    if (details) return details.raw

    const parsed = parseDynamicKey(key)
    if (!parsed) return undefined
    const [base, arg] = parsed
    const fn = this.dynamicConditions[base]
    if (!fn) return undefined
    try {
      const raw = fn(arg ?? '')
      return Array.isArray(raw) ? raw : raw
    } catch {
      return undefined
    }
  }

  getRaw = (condNameOrQuery: ConditionQuery): ConditionDetails | undefined => {
    if (typeof condNameOrQuery !== 'string') {
      try {
        return parseCondition(condNameOrQuery)
      } catch (error) {
        logger.error('core:condition', error)
      }
      return undefined
    }

    if (this.values[condNameOrQuery]) return this.values[condNameOrQuery]

    const parsed = parseDynamicKey(condNameOrQuery)
    if (!parsed) {
      try {
        return parseCondition(condNameOrQuery)
      } catch (error) {
        logger.error('core:condition', error)
      }
      return undefined
    }

    const [base, arg] = parsed
    const fn = this.dynamicConditions[base]
    if (!fn) {
      try {
        return parseCondition(condNameOrQuery)
      } catch (error) {
        logger.error('core:condition', error)
      }
      return undefined
    }

    const cached = this.dynamicCache.get(condNameOrQuery)
    if (cached) return cached

    try {
      const selector = fn(arg ?? '')
      const details = parseCondition(selector)
      if (details) this.dynamicCache.set(condNameOrQuery, details)
      return details
    } catch (error) {
      logger.error('core:condition', error)
      return undefined
    }
  }

  sort = (conditions: string[]): ConditionDetails[] => {
    const rawConditions = conditions.map(this.getRaw).filter(Boolean) as ConditionDetails[]

    // Flatten all conditions while tracking original index for stable sorting
    const flattened = rawConditions.flatMap((cond, index) => flattenCondition(cond, index))

    // Sort: at-rules first, then selectors in original order
    flattened.sort((a, b) => {
      const aIsAtRule = isAtRule(a.cond)
      const bIsAtRule = isAtRule(b.cond)

      // At-rules come first
      if (aIsAtRule && !bIsAtRule) return -1
      if (!aIsAtRule && bIsAtRule) return 1

      // Within same category, preserve original source order
      return a.originalIndex - b.originalIndex
    })

    return flattened.map((item) => item.cond)
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
