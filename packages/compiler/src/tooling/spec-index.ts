import type { Deprecation, Spec } from '@pandacss/compiler-shared'

// Exact/prefix lookups only, no trie — token dictionaries are hundreds of paths, not millions.
export class SpecIndex {
  readonly spec: Spec
  #categoryByProperty: Map<string, string>
  #literalsByProperty: Map<string, string[]>

  constructor(spec: Spec) {
    this.spec = spec
    this.#categoryByProperty = buildCategoryByProperty(spec)
    this.#literalsByProperty = buildLiteralsByProperty(spec)
  }

  resolveTokenValue(path: string): string | undefined {
    return this.spec.tokens.values[path]
  }

  resolveTokenPaths(prefix = ''): string[] {
    const paths = Object.keys(this.spec.tokens.values)
    return prefix ? paths.filter((path) => path.startsWith(prefix)) : paths
  }

  resolveTokenDeprecation(path: string): Deprecation | undefined {
    return this.spec.tokens.deprecated[path]
  }

  hasCondition(name: string): boolean {
    return this.spec.conditions.keys.includes(name)
  }

  /** Bare style-object keys: named/custom conditions plus breakpoints (`sm`, `md`, ...). */
  resolveStyleObjectKeys(): string[] {
    return [...new Set([...this.spec.conditions.keys, ...this.spec.conditions.breakpoints])]
  }

  // `property` may be a canonical utility name or one of its shorthands.
  resolveTokenCategoryForProperty(property: string): string | undefined {
    return this.#categoryByProperty.get(property)
  }

  // Populated for fixed-literal utilities (e.g. `scrollbar: 'visible' | 'hidden'`) instead of a token category.
  resolveLiteralsForProperty(property: string): string[] | undefined {
    return this.#literalsByProperty.get(property)
  }

  resolveKeyframeNames(prefix = ''): string[] {
    const names = this.spec.keyframes.keys
    return prefix ? names.filter((name) => name.startsWith(prefix)) : names
  }
}

function buildCategoryByProperty(spec: Spec): Map<string, string> {
  const map = new Map<string, string>()
  for (const [name, property] of Object.entries(spec.utilities.properties)) {
    if (property.tokenCategory) map.set(name, property.tokenCategory)
  }
  for (const [shorthand, canonical] of Object.entries(spec.utilities.shorthands)) {
    const category = map.get(canonical)
    if (category) map.set(shorthand, category)
  }
  return map
}

function buildLiteralsByProperty(spec: Spec): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const [name, property] of Object.entries(spec.utilities.properties)) {
    if (property.literals.length > 0) map.set(name, property.literals)
  }
  for (const [shorthand, canonical] of Object.entries(spec.utilities.shorthands)) {
    const literals = map.get(canonical)
    if (literals) map.set(shorthand, literals)
  }
  return map
}
