import { type Inspect, type RuleModuleLike, toEslintLoc } from './shared'

export const noDescendantSelectorsRuleName = 'no-descendant-selectors'

/**
 * Walk a selector, reporting each char at nesting depth 0. Quoted strings and
 * `[...]`/`(...)` contents are shielded, so `:is(a, b)` args and attribute
 * values never look like top-level combinators or commas. Escapes (`\\,`) are
 * consumed with the char they escape.
 */
function* topLevelChars(selector: string): Generator<[number, string]> {
  let depth = 0
  let quote: string | undefined
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = undefined
      continue
    }
    if (ch === '\\') {
      i++
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '[' || ch === '(') depth++
    else if (ch === ']' || ch === ')') depth--
    else if (depth === 0) yield [i, ch]
  }
}

/** Split a selector list on top-level commas. */
function splitSelectorList(selector: string): string[] {
  const cuts: number[] = []
  for (const [i, ch] of topLevelChars(selector)) {
    if (ch === ',') cuts.push(i)
  }
  const parts: string[] = []
  let start = 0
  for (const cut of cuts) {
    parts.push(selector.slice(start, cut))
    start = cut + 1
  }
  parts.push(selector.slice(start))
  return parts.map((p) => p.trim()).filter(Boolean)
}

/**
 * True when the selector involves an element other than `&` itself. A part is
 * self-targeting iff it is a single compound containing `&` — no top-level
 * combinator (space, `>`, `+`, `~`). `&` position is irrelevant: `.foo&` is
 * `&.foo`. Anything inside `:is()`/`:where()`/`:has()` args or attribute
 * values only narrows which elements `&` matches, so it never counts.
 */
function targetsOtherElement(part: string): boolean {
  if (!part.includes('&')) return false // no-invalid-nesting owns &-less keys
  for (const [, ch] of topLevelChars(part)) {
    if (ch === ' ' || ch === '\t' || ch === '>' || ch === '+' || ch === '~') return true
  }
  return false
}

export function createNoDescendantSelectorsRule(options: { inspect: Inspect }): RuleModuleLike {
  return {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Disallow selectors that style other elements, keeping every style scoped to its own element.',
      },
      schema: [],
      messages: {
        descendant:
          'Selector "{{selector}}" styles another element. Keep styles on the element they belong to, or use a condition like "_groupHover" for cross-element state.',
      },
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return
          for (const entry of inspection.styleEntries) {
            if (entry.kind !== 'selector') continue
            if (entry.origin === 'generated') continue
            if (!splitSelectorList(entry.name).some(targetsOtherElement)) continue
            context.report({
              messageId: 'descendant',
              data: { selector: entry.name },
              loc: toEslintLoc(entry.range),
            })
          }
        },
      }
    },
  }
}
