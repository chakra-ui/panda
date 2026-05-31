import type { Spec } from './index'

/** Ergonomic, O(1) queries over a {@link Spec} — the shared surface tooling
 *  (linters, formatters, reporters) builds on. Index the spec once, query hot. */
export interface Introspection {
  readonly spec: Spec
  /** A registered utility property or shorthand. */
  isValidProperty(prop: string): boolean
  /** Shorthand → canonical property (identity when not a shorthand). */
  resolveShorthand(prop: string): string
  /** Shorthands that resolve to `prop`. */
  getShorthands(prop: string): string[]
  /** Token category a property accepts (e.g. `colors`), if any. */
  getPropCategory(prop: string): string | undefined
  isColorProperty(prop: string): boolean
  isValidToken(path: string): boolean
  isDeprecatedToken(path: string): boolean
  isColorToken(path: string): boolean
  filterInvalidTokens(paths: string[]): string[]
  filterDeprecatedTokens(paths: string[]): string[]
  /** Condition keys in cascade order. */
  conditions(): string[]
  isCondition(key: string): boolean
  patterns(): string[]
  recipes(): string[]
  jsxFactory(): string | undefined
  /** Compare two style-object keys by canonical order (properties first in emit
   *  order, then conditions, then unknown keys alphabetically). */
  compareProps(a: string, b: string): number
  /** Sort style-object keys by {@link compareProps}. */
  sortProps<T extends string>(keys: readonly T[]): T[]
}

export function introspect(spec: Spec): Introspection {
  const properties = new Set(Object.keys(spec.utilities.properties))
  const shorthands = spec.utilities.shorthands
  const reverseShorthands = new Map<string, string[]>()
  for (const [short, long] of Object.entries(shorthands)) {
    const list = reverseShorthands.get(long)
    if (list) list.push(short)
    else reverseShorthands.set(long, [short])
  }

  const tokens = new Set(Object.keys(spec.tokens.values))
  const deprecatedTokens = new Set(spec.tokens.deprecated)
  const conditionKeys = spec.conditions.keys
  const conditionRank = new Map(conditionKeys.map((key, index) => [key, index]))
  const propRank = new Map(spec.propertyOrder.map((prop, index) => [prop, index]))

  const resolveShorthand = (prop: string) => shorthands[prop] ?? prop
  const getPropCategory = (prop: string) => spec.utilities.properties[resolveShorthand(prop)]?.tokenCategory
  const category = (path: string) => path.slice(0, path.indexOf('.'))

  // Properties rank in emit order; unknown props sort after known ones; condition
  // keys come last (in cascade order). Keeps tiers from colliding.
  const rankOf = (key: string) => {
    if (conditionRank.has(key)) return propRank.size + 1 + (conditionRank.get(key) ?? conditionKeys.length)
    return propRank.get(resolveShorthand(key)) ?? propRank.size
  }

  return {
    spec,
    isValidProperty: (prop) => properties.has(prop) || prop in shorthands,
    resolveShorthand,
    getShorthands: (prop) => reverseShorthands.get(resolveShorthand(prop)) ?? [],
    getPropCategory,
    isColorProperty: (prop) => getPropCategory(prop) === 'colors',
    isValidToken: (path) => tokens.has(path),
    isDeprecatedToken: (path) => deprecatedTokens.has(path),
    isColorToken: (path) => tokens.has(path) && category(path) === 'colors',
    filterInvalidTokens: (paths) => paths.filter((path) => !tokens.has(path)),
    filterDeprecatedTokens: (paths) => paths.filter((path) => deprecatedTokens.has(path)),
    conditions: () => conditionKeys,
    isCondition: (key) => conditionRank.has(key),
    patterns: () => Object.keys(spec.patterns.patterns),
    recipes: () => [...Object.keys(spec.recipes.recipes), ...Object.keys(spec.recipes.slotRecipes)],
    jsxFactory: () => spec.jsxFactory,
    compareProps: (a, b) => rankOf(a) - rankOf(b) || (a < b ? -1 : a > b ? 1 : 0),
    sortProps: (keys) => [...keys].sort((a, b) => rankOf(a) - rankOf(b) || (a < b ? -1 : a > b ? 1 : 0)),
  }
}
