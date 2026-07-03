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

// Property-key chain from a define*() call's own argument down to `target`.
function getLocalPath(root: ts.ObjectLiteralExpression, target: ts.ObjectLiteralExpression): string[] {
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

// Only base/variants.*.* count for defineRecipe; any depth ≥1 counts for
// defineGlobalStyles, since its argument is `{ [selector]: SystemStyleObject }`.
function isRecognizedStyleObjectTarget(kind: StyleObjectDefineKind, localPath: string[]): boolean {
  if (kind === 'global-styles') return localPath.length >= 1
  if (kind === 'recipe') {
    if (localPath.length === 1 && localPath[0] === 'base') return true
    if (localPath.length === 3 && localPath[0] === 'variants') return true
  }
  return false
}

export interface StyleObjectCursorInfo {
  existingKeys: string[]
  cursorKind: 'key' | 'value'
  propertyName?: string
}

export function getStyleObjectCursorInfo(
  sourceFile: ts.SourceFile,
  position: number,
): StyleObjectCursorInfo | undefined {
  const node = findNodeAtPosition(sourceFile, position)
  const objectLiteral = findEnclosingObjectLiteral(node)
  if (!objectLiteral) return undefined

  const defineCall = findEnclosingDefineCall(objectLiteral)
  if (!defineCall) return undefined

  const localPath = getLocalPath(defineCall.argument, objectLiteral)
  if (!isRecognizedStyleObjectTarget(defineCall.kind, localPath)) return undefined

  const existingKeys = objectLiteral.properties
    .filter(ts.isPropertyAssignment)
    .map((property) => propertyKeyText(property.name))
    .filter((key): key is string => key !== undefined)

  const propertyAtCursor = objectLiteral.properties.find(
    (property): property is ts.PropertyAssignment =>
      ts.isPropertyAssignment(property) &&
      position >= property.initializer.getStart() &&
      position <= property.initializer.getEnd() &&
      !ts.isObjectLiteralExpression(property.initializer),
  )

  const propertyName = propertyAtCursor && propertyKeyText(propertyAtCursor.name)
  if (propertyName !== undefined) {
    return { existingKeys, cursorKind: 'value', propertyName }
  }

  return { existingKeys, cursorKind: 'key' }
}
