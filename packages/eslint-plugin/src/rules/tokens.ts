import type { Diagnostic, FileInspectionResult, SourceRange, Span } from '@pandacss/compiler'
import { FILE_START_LOC, type Inspect, type RuleContextWithReport, type RuleModuleLike, toEslintLoc } from './shared'

export const noInvalidTokenPathsRuleName = 'no-invalid-token-paths'

export const unknownTokenReferenceCode = 'unknown_token_reference'

export interface TokenRuleOptions {
  inspect: Inspect
}

export function createNoInvalidTokenPathsRule(options: TokenRuleOptions): RuleModuleLike {
  return createTokenRule({
    description: 'Report unresolved Panda token references for the current file.',
    message: 'Panda token "{{token}}" was not found.',
    inspect: options.inspect,
    report(inspection, context) {
      for (const tokenRef of inspection.tokenRefs) {
        if (tokenRef.resolved) continue
        reportToken(context, tokenRef.path, tokenRef.range)
      }

      const reported = new Set<string>()
      for (const entry of inspection.styleEntries) {
        for (const leaf of entry.valueSpans ?? []) {
          for (const reference of leaf.references ?? []) {
            const key = `${reference.span.start}:${reference.path}`
            if (reference.resolved || reported.has(key)) continue
            reported.add(key)
            reportToken(context, reference.path, reference.range)
          }
        }
      }

      for (const diagnostic of inspection.diagnostics) {
        if (diagnostic.code !== unknownTokenReferenceCode) continue
        if (inspection.styleEntries.some((entry) => contains(diagnostic.span, entry.span))) continue
        reportDiagnostic(context, diagnostic)
      }
    },
  })
}

function contains(outer: Span | undefined, inner: Span): boolean {
  return !!outer && outer.start <= inner.start && inner.end <= outer.end
}

interface TokenRuleConfig {
  description: string
  message: string
  inspect: Inspect
  report: (inspection: FileInspectionResult, context: RuleContextWithReport) => void
}

function createTokenRule(config: TokenRuleConfig): RuleModuleLike {
  return {
    meta: {
      type: 'problem',
      docs: {
        description: config.description,
      },
      schema: [],
      messages: {
        token: config.message,
        diagnostic: '{{message}}',
      },
    },
    create(context) {
      return {
        Program() {
          const inspection = config.inspect(context)
          if (!inspection) return
          config.report(inspection, context)
        },
      }
    },
  }
}

function reportToken(context: RuleContextWithReport, token: string, range: SourceRange): void {
  context.report({
    messageId: 'token',
    data: { token },
    loc: toEslintLoc(range),
  })
}

function reportDiagnostic(context: RuleContextWithReport, diagnostic: Diagnostic): void {
  context.report({
    messageId: 'diagnostic',
    data: { message: diagnostic.message },
    loc: diagnostic.location ? toEslintLoc(diagnostic.location) : FILE_START_LOC,
  })
}
