import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'

interface ParsedImport {
  /** Full match start position in original source */
  start: number
  /** Full match end position (including trailing newline if present) */
  end: number
  /** The module specifier string (e.g. "styled-system/css") */
  mod: string
  /** Original quote character used */
  quote: string
  /** Whether this is `import type` */
  isTypeOnly: boolean
  /** Named specifiers: { original, local } */
  specifiers: Array<{ original: string; local: string }>
  /** Namespace identifier for `import * as X` */
  namespace?: string
}

/**
 * Regex to parse import declarations from source code.
 *
 * Matches:
 * - `import { a, b as c } from "mod"`
 * - `import * as ns from "mod"`
 * - `import type { a } from "mod"`
 *
 * Does NOT match (by design):
 * - `import "mod"` (side-effect — never remove)
 * - `import def from "mod"` (default — not used by panda)
 */
const importRegex = /import\s+(type\s+)?(?:\*\s+as\s+(\w+)|\{([^}]+)\})\s+from\s+(['"])([^'"]+)\4[ \t]*;?/g

function parseImports(code: string): ParsedImport[] {
  const results: ParsedImport[] = []
  let match: RegExpExecArray | null

  while ((match = importRegex.exec(code)) !== null) {
    const [fullMatch, typeKeyword, namespace, specifiersStr, quote, mod] = match
    const start = match.index
    let end = start + fullMatch.length

    // Include trailing newline in removal range
    if (code[end] === '\n') end++

    const isTypeOnly = !!typeKeyword

    const specifiers: ParsedImport['specifiers'] = []
    if (specifiersStr) {
      for (const part of specifiersStr.split(',')) {
        const trimmed = part.trim()
        if (!trimmed) continue
        const asParts = trimmed.split(/\s+as\s+/)
        specifiers.push({
          original: asParts[0].trim(),
          local: (asParts[1] || asParts[0]).trim(),
        })
      }
    }

    results.push({ start, end, mod, quote, isTypeOnly, specifiers, namespace })
  }

  return results
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Collect all panda module paths from the import map.
 */
function getPandaModulePaths(ctx: PandaContext): string[] {
  const importMap = ctx.imports.value
  return [...importMap.css, ...importMap.recipe, ...importMap.pattern, ...importMap.jsx, ...importMap.tokens]
}

/**
 * Check if a module specifier matches any panda module path.
 * Uses `includes` to handle path aliases and nested paths.
 */
function isPandaModule(mod: string, pandaPaths: string[]): boolean {
  return pandaPaths.some((p) => mod.includes(p))
}

/**
 * Remove panda import specifiers that are no longer referenced
 * after inlining. Must be called BEFORE runtime helper injection.
 *
 * Returns true if any imports were removed.
 */
export function removeDeadImports(ms: MagicString, code: string, ctx: PandaContext): boolean {
  const pandaPaths = getPandaModulePaths(ctx)
  const imports = parseImports(code)

  // Get the transformed code (after inlining), strip imports and string contents.
  // Stripping strings prevents false positives from recipe classNames like "textStyle textStyle--size_h1"
  // which contain the import name inside a string literal.
  const transformed = ms.toString()
  const codeBody = transformed.replace(/^\s*import\s+.*$/gm, '').replace(/"[^"]*"|'[^']*'/g, '""')

  let changed = false

  for (const imp of imports) {
    // Skip non-panda modules
    if (!isPandaModule(imp.mod, pandaPaths)) continue

    // Skip type-only imports (erased at compile time anyway)
    if (imp.isTypeOnly) continue

    // Handle namespace imports: import * as ns from "..."
    if (imp.namespace) {
      const regex = new RegExp(`\\b${escapeRegex(imp.namespace)}\\b`)
      if (!regex.test(codeBody)) {
        ms.overwrite(imp.start, imp.end, '')
        changed = true
      }
      continue
    }

    // Handle named imports: import { a, b } from "..."
    if (imp.specifiers.length === 0) continue

    const live = imp.specifiers.filter((s) => {
      const regex = new RegExp(`\\b${escapeRegex(s.local)}\\b`)
      return regex.test(codeBody)
    })

    if (live.length === imp.specifiers.length) continue // nothing to remove

    if (live.length === 0) {
      // All specifiers dead — remove entire import
      ms.overwrite(imp.start, imp.end, '')
    } else {
      // Partial removal — rebuild import with survivors
      const specStr = live.map((s) => (s.original === s.local ? s.local : `${s.original} as ${s.local}`)).join(', ')
      const newImport = `import { ${specStr} } from ${imp.quote}${imp.mod}${imp.quote}`
      // Don't include trailing newline in partial rewrite
      const endNoNewline = imp.end - (code[imp.end - 1] === '\n' ? 1 : 0)
      ms.overwrite(imp.start, endNoNewline, newImport)
    }

    changed = true
  }

  return changed
}
