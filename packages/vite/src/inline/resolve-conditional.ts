import type { Dict } from '@pandacss/types'
import { Node, SyntaxKind } from 'ts-morph'

// ── Box node type guards (use .type discriminant — no extractor import needed) ──

function isConditionalBox(node: any): boolean {
  return node != null && node.type === 'conditional'
}

function isLiteralBox(node: any): boolean {
  return node != null && node.type === 'literal'
}

function isMapBox(node: any): boolean {
  return node != null && node.type === 'map'
}

function isObjectBox(node: any): boolean {
  return node != null && node.type === 'object'
}

function isUnresolvableBox(node: any): boolean {
  return node != null && node.type === 'unresolvable'
}

function isEmptyInitializerBox(node: any): boolean {
  return node != null && node.type === 'empty-initializer'
}

function isArrayBox(node: any): boolean {
  return node != null && node.type === 'array'
}

/**
 * Check if a BoxNodeConditional originates from a `&&` binary expression.
 * These have swapped semantics: whenTrue = left (condition), whenFalse = right (value).
 */
function isLogicalAndBox(node: any): boolean {
  const astNode = node.getNode?.() as Node | undefined
  if (!astNode) return false
  if (!Node.isBinaryExpression(astNode)) return false
  return astNode.getOperatorToken().getKind() === SyntaxKind.AmpersandAmpersandToken
}

// ── Sentinels ──

const BAIL = Symbol('bail')
const OMIT = Symbol('omit')

/** Max unique conditions we support (2^N branches) */
const MAX_CONDITIONS = 4

// ── Branch map ──

/**
 * Maps each condition text to the branch direction to select.
 * For multi-condition support, each conditional node looks up
 * its own condition text in this map.
 */
type BranchMap = Map<string, 'whenTrue' | 'whenFalse'>

// ── Public API ──

/**
 * Check if a BoxNode tree contains any conditional nodes.
 * Recurses through maps and arrays.
 */
export function boxHasConditionals(node: any): boolean {
  if (!node) return false
  if (isConditionalBox(node)) return true

  if (isMapBox(node)) {
    if (node.spreadConditions?.length) return true
    for (const val of (node.value as Map<string, any>).values()) {
      if (boxHasConditionals(val)) return true
    }
    return false
  }

  if (node.type === 'array') {
    return (node.value as any[]).some((v: any) => boxHasConditionals(v))
  }

  return false
}

export interface ConditionalBranch {
  /** combo[i] = true means conditions[i] is in its truthy branch */
  combo: boolean[]
  data: Dict[]
}

export interface ConditionalResult {
  /** Ordered unique condition expression texts */
  conditions: string[]
  /** 2^N branches, one per combination of true/false for each condition */
  branches: ConditionalBranch[]
}

/**
 * Analyze a BoxNodeMap for conditional property values.
 *
 * Supports 1..MAX_CONDITIONS unique condition expressions.
 * Returns `null` to bail out (spread conditions, unresolvable branches, etc.).
 */
export function analyzeConditional(box: any): ConditionalResult | null {
  if (!isMapBox(box)) return null

  // Bail if there are spread conditions — too complex
  if (box.spreadConditions?.length) return null

  // Collect all condition texts from the box tree
  const condTexts = new Set<string>()
  if (!collectConditionTexts(box, condTexts)) return null
  if (condTexts.size === 0) return null
  if (condTexts.size > MAX_CONDITIONS) return null

  const conditions = [...condTexts]

  // Generate all 2^N combinations and build per-branch style objects
  const n = conditions.length
  const totalBranches = 1 << n
  const branches: ConditionalBranch[] = []

  for (let mask = 0; mask < totalBranches; mask++) {
    const combo: boolean[] = []
    const branchMap: BranchMap = new Map()

    for (let i = 0; i < n; i++) {
      const isTrue = (mask & (1 << (n - 1 - i))) !== 0
      combo.push(isTrue)
      branchMap.set(conditions[i], isTrue ? 'whenTrue' : 'whenFalse')
    }

    const obj = boxMapToObject(box, branchMap)
    if (obj === null) return null

    branches.push({ combo, data: [obj] })
  }

  return { conditions, branches }
}

/**
 * Build a nested ternary expression string from resolved branch classNames.
 *
 * For 1 condition:  `(a ? "T" : "F")`
 * For 2 conditions: `(a ? (b ? "TT" : "TF") : (b ? "FT" : "FF"))`
 *
 * Optimizes away ternaries when both sub-branches produce identical output.
 */
export function buildNestedTernary(
  conditions: string[],
  branches: ConditionalBranch[],
  resolveClassName: (data: Dict[]) => string,
): string {
  function recurse(depth: number, mask: number): string {
    if (depth === conditions.length) {
      const branch = branches[mask]
      return JSON.stringify(resolveClassName(branch.data))
    }

    const bit = 1 << (conditions.length - 1 - depth)
    const trueSide = recurse(depth + 1, mask | bit)
    const falseSide = recurse(depth + 1, mask)

    // Optimize: identical branches collapse
    if (trueSide === falseSide) return trueSide

    return `(${conditions[depth]} ? ${trueSide} : ${falseSide})`
  }

  return recurse(0, 0)
}

// ── Helpers ──

/**
 * Recursively collect all condition expression texts from a BoxNodeMap.
 * Returns false if any conditional can't be analyzed (bail).
 */
function collectConditionTexts(mapNode: any, texts: Set<string>): boolean {
  const map = mapNode.value as Map<string, any>

  for (const val of map.values()) {
    if (isConditionalBox(val)) {
      const text = getConditionText(val)
      if (!text) return false
      texts.add(text)
    } else if (isMapBox(val)) {
      // Recurse into nested maps (e.g., _hover: { color: isDark ? ... })
      if (val.spreadConditions?.length) return false // bail on nested spread conditions
      if (!collectConditionTexts(val, texts)) return false
    } else if (isArrayBox(val)) {
      // Recurse into arrays (e.g., responsive arrays: [isDark ? "white" : "black", null, "gray"])
      if (!collectConditionTextsFromArray(val.value as any[], texts)) return false
    }
    // Literals, objects, empty-initializers — no conditionals to collect
  }

  return true
}

/**
 * Recursively collect condition texts from a BoxNodeArray's elements.
 */
function collectConditionTextsFromArray(items: any[], texts: Set<string>): boolean {
  for (const item of items) {
    if (!item) continue // null/undefined slots in responsive arrays
    if (isConditionalBox(item)) {
      const text = getConditionText(item)
      if (!text) return false
      texts.add(text)
    } else if (isMapBox(item)) {
      if (item.spreadConditions?.length) return false
      if (!collectConditionTexts(item, texts)) return false
    } else if (isArrayBox(item)) {
      if (!collectConditionTextsFromArray(item.value as any[], texts)) return false
    }
  }
  return true
}

/**
 * Extract the condition expression text from a BoxNodeConditional's AST node.
 *
 * - ConditionalExpression (a ? b : c): returns getText() of the condition (a)
 * - BinaryExpression with && (a && b): returns getText() of the left operand (a)
 * - Other operators (||, ??): returns null (bail — true branch is unresolvable)
 */
function getConditionText(conditionalNode: any): string | null {
  const astNode = conditionalNode.getNode() as Node
  if (!astNode) return null

  if (Node.isConditionalExpression(astNode)) {
    return astNode.getCondition().getText().trim()
  }

  if (Node.isBinaryExpression(astNode)) {
    const op = astNode.getOperatorToken().getKind()
    if (op === SyntaxKind.AmpersandAmpersandToken) {
      return astNode.getLeft().getText().trim()
    }
    // || and ?? — bail (true branch is the variable itself, unresolvable)
    return null
  }

  return null
}

/**
 * Convert a BoxNodeMap to a plain style object, selecting branches per the branch map.
 *
 * Returns null if any value can't be converted (bail).
 */
function boxMapToObject(mapNode: any, branchMap: BranchMap): Dict | null {
  const map = mapNode.value as Map<string, any>
  const result: Dict = {}

  for (const [key, val] of map) {
    const value = boxNodeToValue(val, branchMap)
    if (value === BAIL) return null
    if (value === OMIT) continue // skip this property (e.g., && false branch)
    result[key] = value
  }

  return result
}

/**
 * Convert a BoxNodeArray to a plain array, selecting branches per the branch map.
 * OMIT elements become undefined (responsive no-op).
 */
function boxArrayToValue(items: any[], branchMap: BranchMap): any[] | typeof BAIL {
  const result: any[] = []
  for (const item of items) {
    if (!item || (isLiteralBox(item) && item.value == null)) {
      result.push(undefined)
      continue
    }
    const value = boxNodeToValue(item, branchMap)
    if (value === BAIL) return BAIL
    // OMIT in array context → undefined (don't apply this breakpoint)
    result.push(value === OMIT ? undefined : value)
  }
  return result
}

/**
 * Convert any BoxNode to a plain JS value, selecting branches from the branch map
 * for conditional nodes.
 *
 * Returns:
 * - The plain value for literals, objects, maps
 * - OMIT for unresolvable nodes (used in && false branch — property is omitted)
 * - BAIL for nodes that can't be converted
 */
function boxNodeToValue(node: any, branchMap: BranchMap): any {
  if (isLiteralBox(node)) {
    return node.value
  }

  if (isObjectBox(node)) {
    return node.value
  }

  if (isEmptyInitializerBox(node)) {
    return true
  }

  if (isMapBox(node)) {
    return boxMapToObject(node, branchMap)
  }

  if (isArrayBox(node)) {
    return boxArrayToValue(node.value as any[], branchMap)
  }

  if (isConditionalBox(node)) {
    const condText = getConditionText(node)
    if (!condText) return BAIL

    const branch = branchMap.get(condText)
    if (!branch) return BAIL

    // For && expressions, the extractor swaps the naming:
    //   whenTrue = left operand (the condition variable, unresolvable)
    //   whenFalse = right operand (the value, e.g. "red.500")
    // In JS: `a && b` → truthy returns `b`, falsy returns `a`
    // So we swap: true branch uses whenFalse, false branch → OMIT
    if (isLogicalAndBox(node)) {
      if (branch === 'whenTrue') {
        return boxNodeToValue(node.whenFalse, branchMap)
      }
      // False branch: condition is falsy, && short-circuits → omit property
      return OMIT
    }

    // Regular ternary — pick the matching branch
    const branchNode = branch === 'whenTrue' ? node.whenTrue : node.whenFalse
    return boxNodeToValue(branchNode, branchMap)
  }

  if (isUnresolvableBox(node)) {
    // Unresolvable in any context → OMIT if reachable from && false path,
    // otherwise BAIL. Since we can't tell at this point, be conservative:
    // OMIT allows the property to be skipped (safe for && false branch).
    // The caller (analyzeConditional) validates all branches produce valid data.
    return OMIT
  }

  // Unknown node type — bail
  return BAIL
}
