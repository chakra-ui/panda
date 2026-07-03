import type { FileInspectionResult, TokenSuggestion, TokenValueRef } from '@pandacss/compiler'
import {
  type Inspect,
  type RuleContextWithReport,
  type RuleModuleLike,
  byteToIndex,
  getSourceText,
  toEslintLoc,
} from './shared'

export const noPrimitiveTokenRuleName = 'no-primitive-token'

export interface NoPrimitiveTokenRuleOptions {
  inspect: Inspect
  /** Semantic tokens that carry the same value as a full token path. */
  suggestSemanticTokens: (path: string) => TokenSuggestion[]
}

interface ReportConfig extends NoPrimitiveTokenRuleOptions {
  /** Categories to enforce; `undefined` means every category with semantic tokens. */
  categories?: ReadonlySet<string>
  allow: ReadonlySet<string>
}

const MAX_SUGGESTIONS = 3

function isAllowed(token: TokenValueRef, allow: ReadonlySet<string>): boolean {
  if (allow.size === 0) return false
  return allow.has(token.path) || allow.has(token.categoryPath)
}

function modifierSuffix(token: TokenValueRef, sourcePath?: string): string {
  if (sourcePath?.startsWith(`${token.path}/`)) return sourcePath.slice(token.path.length)
  return token.modifier ? `/${token.modifier}` : ''
}

function shouldReport(token: TokenValueRef, config: ReportConfig): boolean {
  if (token.semantic || !token.semanticCategory) return false
  if (config.categories && !config.categories.has(token.category)) return false
  return !isAllowed(token, config.allow)
}

function replacementForRange(source: string, range: [number, number], value: string): string {
  const current = source.slice(range[0], range[1])
  const quote = current[0]
  return quote === '"' || quote === "'" || quote === '`' ? `${quote}${value}${quote}` : value
}

function tokenRefFixRange(
  source: string,
  span: { start: number; end: number },
  token: string,
): [number, number] | undefined {
  const outerStart = byteToIndex(source, span.start)
  const outerEnd = byteToIndex(source, span.end)
  const text = source.slice(outerStart, outerEnd)

  for (const quote of ["'", '"', '`']) {
    const needle = `${quote}${token}${quote}`
    const index = text.indexOf(needle)
    if (index >= 0) return [outerStart + index, outerStart + index + needle.length]
  }

  const index = text.indexOf(token)
  return index >= 0 ? [outerStart + index, outerStart + index + token.length] : undefined
}

function tokenRefSourcePath(source: string, span: { start: number; end: number }, path: string): string {
  const outerStart = byteToIndex(source, span.start)
  const outerEnd = byteToIndex(source, span.end)
  const text = source.slice(outerStart, outerEnd)
  const index = text.indexOf(path)
  if (index < 0) return path

  let end = index + path.length
  if (text[end] === '/') {
    end += 1
    while (end < text.length && !["'", '"', '`', ',', ')', ' ', '\n', '\r', '\t'].includes(text[end])) end += 1
  }

  return text.slice(index, end)
}

function reportPrimitiveToken(
  context: RuleContextWithReport,
  source: string | undefined,
  config: ReportConfig,
  token: TokenValueRef,
  loc: Parameters<typeof toEslintLoc>[0],
  fixRange: [number, number] | undefined,
  replacementPath: (suggestion: TokenSuggestion, suffix: string) => string,
  sourcePath?: string,
): void {
  if (!shouldReport(token, config)) return

  const suffix = modifierSuffix(token, sourcePath)
  const suggestions = config.suggestSemanticTokens(token.path).slice(0, MAX_SUGGESTIONS)
  const descriptor: Parameters<typeof context.report>[0] = {
    messageId: 'primitive',
    data: { category: token.category, token: token.categoryPath },
    loc: toEslintLoc(loc),
  }

  if (source && fixRange && suggestions.length > 0) {
    descriptor.suggest = suggestions.map((suggestion) => {
      const replacement = replacementPath(suggestion, suffix)
      return {
        desc: `Use the semantic token "${replacement}"`,
        fix: (fixer) => fixer.replaceTextRange(fixRange, replacementForRange(source, fixRange, replacement)),
      }
    })
  }

  context.report(descriptor)
}

function reportStyleEntries(
  context: RuleContextWithReport,
  inspection: FileInspectionResult,
  config: ReportConfig,
  source: string | undefined,
): void {
  for (const entry of inspection.styleEntries) {
    if (entry.kind !== 'utility') continue

    for (const leaf of entry.valueSpans ?? []) {
      if (!leaf.token) continue
      const fixRange: [number, number] | undefined = source
        ? [byteToIndex(source, leaf.span.start), byteToIndex(source, leaf.span.end)]
        : undefined

      reportPrimitiveToken(context, source, config, leaf.token, entry.range, fixRange, (suggestion, suffix) => {
        return `${suggestion.token}${suffix}`
      })
    }
  }
}

function reportTokenRefs(
  context: RuleContextWithReport,
  inspection: FileInspectionResult,
  config: ReportConfig,
  source: string | undefined,
): void {
  for (const tokenRef of inspection.tokenRefs) {
    if (!tokenRef.resolved || !tokenRef.token) continue

    const sourcePath = source ? tokenRefSourcePath(source, tokenRef.span, tokenRef.path) : tokenRef.path
    const fixRange = source ? tokenRefFixRange(source, tokenRef.span, sourcePath) : undefined

    reportPrimitiveToken(
      context,
      source,
      config,
      tokenRef.token,
      tokenRef.range,
      fixRange,
      (suggestion, suffix) => `${tokenRef.token?.category}.${suggestion.token}${suffix}`,
      sourcePath,
    )
  }
}

export function reportPrimitiveTokenViolations(
  context: RuleContextWithReport,
  inspection: FileInspectionResult,
  config: ReportConfig,
): void {
  const source = getSourceText(context)
  reportStyleEntries(context, inspection, config, source)
  reportTokenRefs(context, inspection, config, source)
}

export function createNoPrimitiveTokenRule(options: NoPrimitiveTokenRuleOptions): RuleModuleLike {
  return {
    meta: {
      type: 'suggestion',
      docs: { description: 'Prefer semantic tokens over primitive tokens when semantic tokens exist for a category.' },
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
        primitive: 'Use a semantic {{category}} token instead of the primitive token "{{token}}".',
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
          reportPrimitiveTokenViolations(context, inspection, { ...options, categories, allow })
        },
      }
    },
  }
}
