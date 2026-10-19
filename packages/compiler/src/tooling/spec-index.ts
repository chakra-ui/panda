import type { Spec } from '@pandacss/compiler-shared'

export class SpecIndex {
  #categoryByProperty: Map<string, string>

  constructor(spec: Spec) {
    this.#categoryByProperty = buildCategoryByProperty(spec)
  }

  // `property` may be a canonical utility name or one of its shorthands.
  resolveTokenCategoryForProperty(property: string): string | undefined {
    return this.#categoryByProperty.get(property)
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
