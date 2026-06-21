import type { FileInspectionResult } from '@pandacss/compiler'
import { type Inspect, type RuleContextWithReport, type RuleModuleLike, toEslintLoc } from './shared'

export const preferTokenRuleName = 'prefer-token'

export interface PreferTokenRuleOptions {
  inspect: Inspect
  /** Property (canonical) → its token category, or `undefined` if not token-backed. */
  categoryOf: (prop: string) => string | undefined
  /** Whether `value` on `prop` resolved to a raw value rather than a token var. */
  isHardcodedValue: (prop: string, value: string) => boolean
}

/** Flatten the string leaves of a folded style value (handles conditions/arrays). */
export function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out)
  else if (value && typeof value === 'object') for (const item of Object.values(value)) collectStrings(item, out)
}

interface ReportConfig {
  categoryOf: (prop: string) => string | undefined
  isHardcodedValue: (prop: string, value: string) => boolean
  /** Categories to enforce; `undefined` means every token-backed category. */
  categories?: ReadonlySet<string>
  allow: ReadonlySet<string>
  message: (category: string, value: string) => string
}

/** Shared engine: flag utility entries whose value is raw where a token exists. */
export function reportTokenViolations(
  context: RuleContextWithReport,
  inspection: FileInspectionResult,
  config: ReportConfig,
): void {
  for (const entry of inspection.styleEntries) {
    if (entry.kind !== 'utility') continue
    const category = config.categoryOf(entry.canonicalName ?? entry.name)
    if (!category) continue
    if (config.categories && !config.categories.has(category)) continue

    const values: string[] = []
    collectStrings(entry.resolvedValue, values)
    const hit = values.find((value) => !config.allow.has(value.trim()) && config.isHardcodedValue(entry.name, value))
    if (hit === undefined) continue

    context.report({ message: config.message(category, hit), loc: toEslintLoc(entry.range) })
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
      messages: { token: '{{message}}' },
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
            categories,
            allow,
            message: (category, value) => `Use a ${category} token instead of the hardcoded value "${value}".`,
          })
        },
      }
    },
  }
}
