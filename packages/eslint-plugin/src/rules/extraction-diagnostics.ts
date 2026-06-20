import type { Diagnostic } from '@pandacss/compiler'
import { type Inspect, type RuleContextWithReport, type RuleModuleLike, toEslintLoc } from './shared'

export const extractionDiagnosticsRuleName = 'extraction-diagnostics'

export interface ExtractionDiagnosticsRuleOptions {
  inspect: Inspect
}

export function createExtractionDiagnosticsRule(options: ExtractionDiagnosticsRuleOptions): RuleModuleLike {
  return {
    meta: {
      type: 'problem',
      docs: {
        description: 'Report Panda extraction diagnostics for the current file.',
      },
      schema: [],
      messages: {
        diagnostic: '{{message}}',
      },
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return
          reportDiagnostics(context, inspection.diagnostics)
        },
      }
    },
  }
}

export function reportDiagnostics(context: RuleContextWithReport, diagnostics: readonly Diagnostic[]): void {
  for (const diagnostic of diagnostics) {
    context.report({
      message: diagnostic.message,
      ...(diagnostic.location ? { loc: toEslintLoc(diagnostic.location) } : {}),
    })
  }
}
