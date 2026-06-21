import { type Inspect, type RuleModuleLike, byteToIndex, toEslintLoc } from './shared'

export const noInvalidNestingRuleName = 'no-invalid-nesting'

/** A key shaped like a CSS selector (pseudo, class, id, attr, combinator). */
function isSelectorKey(name: string): boolean {
  const trimmed = name.trim()
  return /^[:.#[*>+~]/.test(trimmed) || trimmed.includes(':')
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function createNoInvalidNestingRule(options: { inspect: Inspect }): RuleModuleLike {
  return {
    meta: {
      type: 'problem',
      docs: { description: 'Disallow nested selectors that omit "&", which Panda silently ignores.' },
      schema: [],
      messages: {
        nesting:
          'Nested selector "{{selector}}" has no "&", so Panda ignores it. Use "{{fixed}}" or a condition like "_hover".',
      },
      hasSuggestions: true,
    },
    create(context) {
      const source = context.sourceCode?.text ?? ''
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return

          for (const entry of inspection.styleEntries) {
            // A selector-shaped key with a nested object that Panda didn't
            // recognize as a condition/selector — i.e. it's missing `&`.
            if (entry.kind !== 'unknown' || !isSelectorKey(entry.name) || !isObject(entry.resolvedValue)) continue

            const fixed = `&${entry.name}`
            const descriptor: Parameters<typeof context.report>[0] = {
              messageId: 'nesting',
              data: { selector: entry.name, fixed },
              loc: toEslintLoc(entry.range),
            }

            if (entry.fixable === 'safe' && entry.keySpan && source) {
              const range: [number, number] = [
                byteToIndex(source, entry.keySpan.start),
                byteToIndex(source, entry.keySpan.end),
              ]
              descriptor.suggest = [
                { desc: `Prefix with "&" → "${fixed}"`, fix: (fixer) => fixer.replaceTextRange(range, `'${fixed}'`) },
              ]
            }
            context.report(descriptor)
          }
        },
      }
    },
  }
}
