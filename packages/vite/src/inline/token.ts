import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { ParserResultInterface, ResultItem } from '@pandacss/types'
import { Node, SyntaxKind } from 'ts-morph'
import { findCallExpression } from './find-call'

/**
 * Inline a standalone `token('path')` call (from parser result),
 * replacing it with the resolved string literal.
 *
 * token('colors.red.500')       → "#ef4444"
 * token('nonexistent', '#fb')   → "#fb"
 */
export function inlineTokenCall(ms: MagicString, item: ResultItem, ctx: PandaContext): boolean {
  if (!item.box) return false

  const callNode = findCallExpression(item.box.getNode())
  if (!callNode) return false

  // token() calls have an Identifier expression.
  // token.var() calls would have a PropertyAccessExpression — skip here (handled separately)
  const expr = callNode.getExpression()
  if (expr.getKind() !== SyntaxKind.Identifier) return false

  return resolveAndReplace(ms, callNode, false, ctx)
}

/**
 * Find and inline `token.var('path')` calls by scanning the AST directly.
 *
 * The parser doesn't extract `token.var()` calls into parserResult.token,
 * so we scan the source file's AST for PropertyAccessExpression calls
 * where the object is a token import and the property is `.var`.
 */
export function inlineTokenVarCalls(ms: MagicString, parserResult: ParserResultInterface, ctx: PandaContext): boolean {
  // Get the source file from any result item's AST node
  const sourceFile = getSourceFileFromResult(parserResult)
  if (!sourceFile) return false

  const tokenPaths = ctx.imports.value.tokens
  const tokenLocalNames = getTokenLocalNames(sourceFile, tokenPaths)
  if (tokenLocalNames.size === 0) return false

  let changed = false

  sourceFile.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return

    const expr = node.getExpression()
    if (!Node.isPropertyAccessExpression(expr)) return
    if (expr.getName() !== 'var') return

    const obj = expr.getExpression()
    if (!Node.isIdentifier(obj)) return
    if (!tokenLocalNames.has(obj.getText())) return

    // This is a token.var(...) call — resolve and replace
    if (resolveAndReplace(ms, node, true, ctx)) {
      changed = true
    }
  })

  return changed
}

// ── Helpers ──────────────────────────────────────────────────────────────

function resolveAndReplace(ms: MagicString, callNode: Node, isVarMethod: boolean, ctx: PandaContext): boolean {
  const args = (callNode as any).getArguments() as Node[]
  if (!args || args.length === 0) return false

  // First argument must be a string literal (token path)
  const pathArg = args[0]
  if (!Node.isStringLiteral(pathArg)) return false
  const tokenPath = pathArg.getLiteralValue()

  // Optional second argument (fallback) — must be string literal if present
  let fallback: string | undefined
  if (args.length >= 2) {
    const fallbackArg = args[1]
    if (Node.isStringLiteral(fallbackArg)) {
      fallback = fallbackArg.getLiteralValue()
    }
  }

  const resolved = isVarMethod ? ctx.tokens.view.getVar(tokenPath, fallback) : ctx.tokens.view.get(tokenPath, fallback)

  if (resolved == null) return false

  try {
    ms.overwrite(callNode.getStart(), callNode.getEnd(), JSON.stringify(String(resolved)))
  } catch {
    // Range already modified by an outer inlining pass (e.g., token() inside css())
    return false
  }
  return true
}

/**
 * Get the ts-morph SourceFile from any result item's box node.
 */
function getSourceFileFromResult(parserResult: ParserResultInterface) {
  for (const item of parserResult.all) {
    if (item.box) {
      try {
        return item.box.getNode().getSourceFile()
      } catch {
        continue
      }
    }
  }
  return undefined
}

/**
 * Find local names for `token` imported from panda tokens modules.
 * Handles aliased imports: `import { token as t } from "styled-system/tokens"`
 */
function getTokenLocalNames(sourceFile: ReturnType<Node['getSourceFile']>, pandaTokenPaths: string[]): Set<string> {
  const names = new Set<string>()
  for (const imp of sourceFile.getImportDeclarations()) {
    const mod = imp.getModuleSpecifierValue()
    if (!pandaTokenPaths.some((p) => mod.includes(p))) continue
    for (const spec of imp.getNamedImports()) {
      if (spec.getName() === 'token') {
        names.add(spec.getAliasNode()?.getText() ?? spec.getName())
      }
    }
  }
  return names
}
