import type { FileInspectionResult, SourceRange } from '@pandacss/compiler'
import { type Inspect, type RuleContextWithReport, type RuleModuleLike, toEslintLoc } from './shared'

export const noInvalidTokenPathsRuleName = 'no-invalid-token-paths'

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
        reportToken(context, tokenRef.path, tokenRef.range, 'Panda token "{{token}}" was not found.')
      }
    },
  })
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

function reportToken(context: RuleContextWithReport, token: string, range: SourceRange, message: string): void {
  context.report({
    message: message.replace('{{token}}', token),
    loc: toEslintLoc(range),
  })
}
