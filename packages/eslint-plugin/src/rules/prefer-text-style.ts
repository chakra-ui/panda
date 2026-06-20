import type { SourceRange } from '@pandacss/compiler'
import { type Inspect, type RuleModuleLike, toEslintLoc } from './shared'

export const preferTextStyleRuleName = 'prefer-text-style'

const MESSAGE = 'Multiple typography properties set together; prefer a `textStyle` token.'

const TYPOGRAPHY = new Set([
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'fontFamily',
  'textDecoration',
  'textTransform',
  'fontStyle',
])

/** True when any single object sets two or more typography properties. */
function clustersTextStyle(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(clustersTextStyle)
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const count = Object.keys(obj).filter((key) => TYPOGRAPHY.has(key)).length
    if (count >= 2) return true
    return Object.values(obj).some(clustersTextStyle)
  }
  return false
}

export function createPreferTextStyleRule(options: { inspect: Inspect }): RuleModuleLike {
  return {
    meta: {
      type: 'suggestion',
      docs: { description: 'Prefer a `textStyle` token over multiple typography properties.' },
      schema: [],
      messages: { textStyle: MESSAGE },
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return
          const report = (range: SourceRange) => context.report({ message: MESSAGE, loc: toEslintLoc(range) })

          for (const call of inspection.calls) {
            if (call.data.some((arg) => clustersTextStyle(arg.value))) report(call.range)
          }
          for (const jsx of inspection.jsx) {
            if (clustersTextStyle(jsx.data)) report(jsx.range)
          }
        },
      }
    },
  }
}
