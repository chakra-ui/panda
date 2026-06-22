import type { FileInspectionResult, TokenSuggestion } from '@pandacss/compiler'
import {
  type Inspect,
  type RuleContextWithReport,
  type RuleModuleLike,
  byteToIndex,
  getSourceText,
  toEslintLoc,
} from './shared'

export const preferTokenRuleName = 'prefer-token'

export type SuggestTokens = (prop: string, value: string) => TokenSuggestion[]

export interface PreferTokenRuleOptions {
  inspect: Inspect
  /** Property (canonical) → its token category, or `undefined` if not token-backed. */
  categoryOf: (prop: string) => string | undefined
  /** Whether `value` on `prop` resolved to a raw value rather than a token var. */
  isHardcodedValue: (prop: string, value: string) => boolean
  /** Tokens that carry a value, ranked (safe equivalents first). */
  suggest: SuggestTokens
}

/** Most tokens to list/offer for one value. */
const MAX_LISTED = 3

/** Flatten the string leaves of a folded style value (handles conditions/arrays). */
export function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out)
  else if (value && typeof value === 'object') for (const item of Object.values(value)) collectStrings(item, out)
}

const label = (s: TokenSuggestion) => (s.conditional ? `${s.token} (themed)` : s.token)

interface ReportConfig {
  categoryOf: (prop: string) => string | undefined
  isHardcodedValue: (prop: string, value: string) => boolean
  suggest: SuggestTokens
  /** Categories to enforce; `undefined` means every token-backed category. */
  categories?: ReadonlySet<string>
  allow: ReadonlySet<string>
}

/** Shared engine: flag utility entries whose value is raw where a token exists. */
export function reportTokenViolations(
  context: RuleContextWithReport,
  inspection: FileInspectionResult,
  config: ReportConfig,
): void {
  const source = getSourceText(context)

  for (const entry of inspection.styleEntries) {
    if (entry.kind !== 'utility') continue
    const category = config.categoryOf(entry.canonicalName ?? entry.name)
    if (!category) continue
    if (config.categories && !config.categories.has(category)) continue

    const values: string[] = []
    collectStrings(entry.resolvedValue, values)
    const hit = values.find((value) => !config.allow.has(value.trim()) && config.isHardcodedValue(entry.name, value))
    if (hit === undefined) continue

    const suggestions = config.suggest(entry.name, hit).slice(0, MAX_LISTED)
    const descriptor: Parameters<typeof context.report>[0] = suggestions.length
      ? {
          messageId: 'listed',
          data: { category, value: hit, tokens: suggestions.map(label).join(', ') },
          loc: toEslintLoc(entry.range),
        }
      : { messageId: 'generic', data: { category, value: hit }, loc: toEslintLoc(entry.range) }

    // Offer quick-fixes when we know the offending leaf's exact span (flat
    // literals and values nested in conditions). Array elements have no span yet.
    const leaf = entry.valueSpans?.find((v) => v.value === hit)
    if (suggestions.length > 0 && leaf && source) {
      const range: [number, number] = [byteToIndex(source, leaf.span.start), byteToIndex(source, leaf.span.end)]
      descriptor.suggest = suggestions.map((s) => ({
        desc: `Use the token "${s.token}"`,
        fix: (fixer) => fixer.replaceTextRange(range, `'${s.token}'`),
      }))
    }

    context.report(descriptor)
  }
}

export function createPreferTokenRule(options: PreferTokenRuleOptions): RuleModuleLike {
  return {
    meta: {
      type: 'suggestion',
      docs: { description: 'Prefer design tokens over hardcoded values on token-backed properties.' },
      schema: [
        {
          type: 'object',
          properties: {
            categories: { type: 'array', items: { type: 'string' }, uniqueItems: true },
            allow: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          },
          additionalProperties: false,
        },
      ],
      messages: {
        listed: 'Hardcoded {{category}} value "{{value}}". Matching tokens: {{tokens}}.',
        generic: 'Use a {{category}} token instead of the hardcoded value "{{value}}".',
      },
      hasSuggestions: true,
    },
    create(context) {
      const configured = context.options?.[0] as { categories?: string[]; allow?: string[] } | undefined
      const categories = configured?.categories ? new Set(configured.categories) : undefined
      const allow = new Set(configured?.allow ?? [])

      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return
          reportTokenViolations(context, inspection, {
            categoryOf: options.categoryOf,
            isHardcodedValue: options.isHardcodedValue,
            suggest: options.suggest,
            categories,
            allow,
          })
        },
      }
    },
  }
}
