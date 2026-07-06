import ts from 'typescript'

export function findNodeAtPosition(root: ts.Node, position: number): ts.Node {
  let found: ts.Node = root
  const visit = (node: ts.Node): void => {
    if (position < node.getStart() || position > node.getEnd()) return
    found = node
    node.forEachChild(visit)
  }
  visit(root)
  return found
}

export function findEnclosingStringLiteral(root: ts.Node, position: number): ts.StringLiteralLike | undefined {
  const node = findNodeAtPosition(root, position)
  return ts.isStringLiteralLike(node) ? node : undefined
}

function findEnclosingObjectLiteral(node: ts.Node): ts.ObjectLiteralExpression | undefined {
  let current: ts.Node | undefined = node
  while (current) {
    if (ts.isObjectLiteralExpression(current)) return current
    current = current.parent
  }
  return undefined
}

function propertyKeyText(name: ts.PropertyName): string | undefined {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined
}

// A leading `theme` segment is stripped, since recipes/globalCss/patterns can live
// under `theme` or the config root. General-purpose; not used for completion gating.
export function getContainerPath(node: ts.Node): string[] {
  const path: string[] = []
  let current: ts.Node | undefined = node
  while (current) {
    if (ts.isPropertyAssignment(current)) {
      const key = propertyKeyText(current.name)
      if (key !== undefined) path.unshift(key)
    }
    current = current.parent
  }
  return path[0] === 'theme' ? path.slice(1) : path
}

export type StyleObjectDefineKind = 'recipe' | 'global-styles'

export interface DefineCallMatch {
  kind: StyleObjectDefineKind
  argument: ts.ObjectLiteralExpression
}

const RECIPE_DEFINE_NAMES = new Set(['defineRecipe'])
const GLOBAL_STYLES_DEFINE_NAMES = new Set(['defineGlobalStyles'])

function calleeName(call: ts.CallExpression): string | undefined {
  return ts.isIdentifier(call.expression) ? call.expression.text : undefined
}

// Requires a recognized define*() call — the syntactic marker that disambiguates a
// style object from any other shape, and shows defineGlobalStyles' argument is selector-keyed.
export function findEnclosingDefineCall(node: ts.Node): DefineCallMatch | undefined {
  let current: ts.Node | undefined = node
  while (current) {
    if (ts.isCallExpression(current)) {
      const name = calleeName(current)
      const [firstArg] = current.arguments
      if (name && firstArg && ts.isObjectLiteralExpression(firstArg)) {
        if (RECIPE_DEFINE_NAMES.has(name)) return { kind: 'recipe', argument: firstArg }
        if (GLOBAL_STYLES_DEFINE_NAMES.has(name)) return { kind: 'global-styles', argument: firstArg }
      }
    }
    current = current.parent
  }
  return undefined
}

// Property-key chain from a define*() call's own argument down to `target` — array literals
// are transparent (arrays never have keys of their own; what matters is whichever property
// assignment's initializer the array itself sits inside).
function getLocalPath(root: ts.ObjectLiteralExpression, target: ts.Node): string[] {
  const path: string[] = []
  let current: ts.Node = target
  while (current !== root) {
    const parent: ts.Node = current.parent
    if (ts.isPropertyAssignment(parent) && parent.initializer === current) {
      const key = propertyKeyText(parent.name)
      if (key !== undefined) path.unshift(key)
    }
    current = parent
  }
  return path
}

// Strips the define*() call's own prefix (base/variants.<name>.<value>, or the selector for
// defineGlobalStyles), leaving the key chain relative to the style object itself — undefined
// if `fullPath` isn't actually inside a recognized style object at all.
function toStyleObjectPath(kind: StyleObjectDefineKind, fullPath: string[]): string[] | undefined {
  if (kind === 'global-styles') return fullPath.length >= 1 ? fullPath.slice(1) : undefined
  if (fullPath[0] === 'base') return fullPath.slice(1)
  if (fullPath[0] === 'variants' && fullPath.length >= 3) return fullPath.slice(3)
  return undefined
}

export interface StyleObjectCursorInfo {
  existingKeys: string[]
  cursorKind: 'key' | 'value'
  /**
   * Style-object-relative key chain leading to the cursor — e.g. `['color']` for a plain
   * `color: 're'`, or `['backgroundColor', 'sm']` for `backgroundColor: { sm: 're' }` (a
   * utility's own inline conditional value, which can nest to any depth:
   * `ConditionalValue<V> = V | Array<V> | { [condition]?: ConditionalValue<V> }`). This layer
   * has no spec access, so it can't tell a condition key (nested style object) from a utility
   * key (its own conditional-value wrapper) apart — the completion layer, which does have the
   * spec, resolves the first segment that's a real utility and treats everything after it as
   * condition keys wrapping that same property's value.
   */
  propertyPath: string[]
}

export function getStyleObjectCursorInfo(
  sourceFile: ts.SourceFile,
  position: number,
): StyleObjectCursorInfo | undefined {
  const node = findNodeAtPosition(sourceFile, position)
  const defineCall = findEnclosingDefineCall(node)
  if (!defineCall) return undefined

  if (ts.isStringLiteralLike(node)) {
    const fullPath = getLocalPath(defineCall.argument, node)
    const propertyPath = toStyleObjectPath(defineCall.kind, fullPath)
    if (!propertyPath || propertyPath.length === 0) return undefined
    return { existingKeys: [], cursorKind: 'value', propertyPath }
  }

  const objectLiteral = findEnclosingObjectLiteral(node)
  if (!objectLiteral) return undefined

  const fullPath = getLocalPath(defineCall.argument, objectLiteral)
  const propertyPath = toStyleObjectPath(defineCall.kind, fullPath)
  if (!propertyPath) return undefined

  const existingKeys = objectLiteral.properties
    .filter(ts.isPropertyAssignment)
    .map((property) => propertyKeyText(property.name))
    .filter((key): key is string => key !== undefined)

  return { existingKeys, cursorKind: 'key', propertyPath }
}

const SEMANTIC_TOKENS_NAME = 'defineSemanticTokens'

interface SemanticTokensCallMatch {
  argument: ts.ObjectLiteralExpression
  /** Set for `defineSemanticTokens.colors(...)` — already scoped to one category. */
  category?: string
}

// `defineSemanticTokens` is a Proxy: both `defineSemanticTokens({...})` (top level keyed by
// category) and `defineSemanticTokens.colors({...})` (already inside one category) are valid.
function findEnclosingSemanticTokensCall(node: ts.Node): SemanticTokensCallMatch | undefined {
  let current: ts.Node | undefined = node
  while (current) {
    if (ts.isCallExpression(current)) {
      const [firstArg] = current.arguments
      if (firstArg && ts.isObjectLiteralExpression(firstArg)) {
        const callee = current.expression
        if (ts.isIdentifier(callee) && callee.text === SEMANTIC_TOKENS_NAME) {
          return { argument: firstArg }
        }
        if (
          ts.isPropertyAccessExpression(callee) &&
          ts.isIdentifier(callee.expression) &&
          callee.expression.text === SEMANTIC_TOKENS_NAME &&
          ts.isIdentifier(callee.name)
        ) {
          return { argument: firstArg, category: callee.name.text }
        }
      }
    }
    current = current.parent
  }
  return undefined
}

// True once `objectLiteral` is (possibly nested inside) some token's `value: {...}` —
// values can themselves be conditional objects (`{ base: '...', _dark: {...} }`).
function isTokenValueObject(objectLiteral: ts.ObjectLiteralExpression): boolean {
  let current: ts.Node = objectLiteral
  while (true) {
    const parent: ts.Node = current.parent
    if (!ts.isPropertyAssignment(parent) || parent.initializer !== current) return false
    if (propertyKeyText(parent.name) === 'value') return true
    current = parent.parent
    if (!ts.isObjectLiteralExpression(current)) return false
  }
}

export type SemanticTokenCursorKind = 'category' | 'condition'

export interface SemanticTokenCursorInfo {
  cursorKind: SemanticTokenCursorKind
  existingKeys: string[]
}

export function getSemanticTokenCursorInfo(
  sourceFile: ts.SourceFile,
  position: number,
): SemanticTokenCursorInfo | undefined {
  const node = findNodeAtPosition(sourceFile, position)
  const objectLiteral = findEnclosingObjectLiteral(node)
  if (!objectLiteral) return undefined

  const call = findEnclosingSemanticTokensCall(objectLiteral)
  if (!call) return undefined

  const existingKeys = objectLiteral.properties
    .filter(ts.isPropertyAssignment)
    .map((property) => propertyKeyText(property.name))
    .filter((key): key is string => key !== undefined)

  // Category completion only applies to the call's own top-level object, and only for the
  // full defineSemanticTokens({...}) form — `.colors(...)` is already scoped to one category.
  if (objectLiteral === call.argument && !call.category) {
    return { cursorKind: 'category', existingKeys }
  }

  if (isTokenValueObject(objectLiteral)) {
    return { cursorKind: 'condition', existingKeys }
  }

  return undefined
}
