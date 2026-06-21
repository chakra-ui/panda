import type { FileInspectionResult, SourceRange } from '@pandacss/compiler'
import type { LintRuleContextLike } from '../core'

export interface RuleFixer {
  replaceTextRange(range: [number, number], text: string): unknown
}

export interface SuggestionDescriptor {
  desc: string
  fix: (fixer: RuleFixer) => unknown
}

export interface ReportDescriptor {
  message: string
  loc?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  suggest?: SuggestionDescriptor[]
}

export interface RuleContextWithReport extends LintRuleContextLike {
  report: (descriptor: ReportDescriptor) => void
  options?: readonly unknown[]
}

export interface RuleModuleLike {
  meta: {
    type: 'problem' | 'suggestion' | 'layout'
    docs: {
      description: string
    }
    schema: unknown[]
    messages: Record<string, string>
    hasSuggestions?: boolean
  }
  create: (context: RuleContextWithReport) => Record<string, () => void>
}

export type Inspect = (context: LintRuleContextLike) => FileInspectionResult | undefined

/** ESLint columns are 0-based; Panda source ranges are 1-based. */
export function toEslintLoc(range: SourceRange): ReportDescriptor['loc'] {
  return {
    start: {
      line: range.start.line,
      column: Math.max(0, range.start.column - 1),
    },
    end: {
      line: range.end.line,
      column: Math.max(0, range.end.column - 1),
    },
  }
}
