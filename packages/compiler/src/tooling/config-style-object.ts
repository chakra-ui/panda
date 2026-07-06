import type { SpecIndex } from './spec-index'

export type StyleObjectCursorKind = 'key' | 'value'

export interface StyleObjectContext {
  existingKeys: string[]
  cursorKind: StyleObjectCursorKind
  /**
   * Style-object-relative key chain leading to the cursor (see typescript-plugin's
   * `getStyleObjectCursorInfo`) — e.g. `['color']`, or `['backgroundColor', 'sm']` for a
   * utility's own inline conditional value (`backgroundColor: { sm: 're' }`).
   */
  propertyPath: string[]
  prefix: string
}

export type CompletionEntryKind = 'utility' | 'condition' | 'token' | 'keyframe' | 'literal' | 'keyword' | 'category'

export interface CompletionEntry {
  name: string
  kind: CompletionEntryKind
}

// Valid for any CSS property — matches codegen's generated `Globals` union.
const CSS_WIDE_KEYWORDS = ['inherit', 'initial', 'revert', 'revert-layer', 'unset']

// Caller must confirm the position is actually a style object first (see
// typescript-plugin's define*()-gated AST detection) — this has no opinion on where.
export function completeConfigStyleObject(context: StyleObjectContext, index: SpecIndex): CompletionEntry[] {
  // The first segment that resolves as a real utility claims everything after it as condition
  // keys wrapping that same property's inline conditional value, at any depth — a condition's
  // own value is always a nested style object, never a utility's conditional-value shape, so
  // there's never more than one active property along a given path.
  const activeProperty = context.propertyPath.find((segment) => isKnownUtilityProperty(segment, index))

  if (context.cursorKind === 'value') {
    return activeProperty ? completeStyleValue(activeProperty, context.prefix, index) : []
  }

  if (activeProperty) {
    return completeConditionKey(context.existingKeys, context.prefix, index)
  }
  return completeStyleKey(context.existingKeys, context.prefix, index)
}

function completeStyleKey(existingKeys: string[], prefix: string, index: SpecIndex): CompletionEntry[] {
  const used = new Set(existingKeys)
  const utilityNames = [
    ...Object.keys(index.spec.utilities.properties),
    ...Object.keys(index.spec.utilities.shorthands),
  ]

  const utilities: CompletionEntry[] = utilityNames
    .filter((name) => !used.has(name) && name.startsWith(prefix))
    .map((name) => ({ name, kind: 'utility' }))

  const conditions: CompletionEntry[] = index
    .resolveStyleObjectKeys()
    .filter((name) => !used.has(name) && name.startsWith(prefix))
    .map((name) => ({ name, kind: 'condition' }))

  return [...utilities, ...conditions]
}

// Inside a utility's own inline conditional value (`backgroundColor: { | }`) only
// condition/breakpoint keys are valid — utility names don't belong here.
function completeConditionKey(existingKeys: string[], prefix: string, index: SpecIndex): CompletionEntry[] {
  const used = new Set(existingKeys)
  return index
    .resolveStyleObjectKeys()
    .filter((name) => !used.has(name) && name.startsWith(prefix))
    .map((name) => ({ name, kind: 'condition' }))
}

function completeStyleValue(property: string, prefix: string, index: SpecIndex): CompletionEntry[] {
  if (!isKnownUtilityProperty(property, index)) return []

  const entries = resolvePropertyValues(property, prefix, index)
  const keywords: CompletionEntry[] = CSS_WIDE_KEYWORDS.filter((keyword) => keyword.startsWith(prefix)).map((name) => ({
    name,
    kind: 'keyword',
  }))
  return [...entries, ...keywords]
}

function resolvePropertyValues(property: string, prefix: string, index: SpecIndex): CompletionEntry[] {
  const category = index.resolveTokenCategoryForProperty(property)

  // "keyframes" is a sentinel category (animationName etc.) — not a real token category.
  if (category === 'keyframes') {
    return index.resolveKeyframeNames(prefix).map((name) => ({ name, kind: 'keyframe' }))
  }

  if (category) {
    const categoryPrefix = `${category}.`
    return index
      .resolveTokenPaths(`${categoryPrefix}${prefix}`)
      .filter((path) => index.resolveTokenDeprecation(path) === undefined)
      .map((path) => ({ name: path.slice(categoryPrefix.length), kind: 'token' }))
  }

  const literals = index.resolveLiteralsForProperty(property)
  if (literals) {
    return literals.filter((value) => value.startsWith(prefix)).map((value) => ({ name: value, kind: 'literal' }))
  }

  return []
}

function isKnownUtilityProperty(property: string, index: SpecIndex): boolean {
  return property in index.spec.utilities.properties || property in index.spec.utilities.shorthands
}
