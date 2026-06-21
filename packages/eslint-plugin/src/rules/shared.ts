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
  messageId: string
  data?: Record<string, string>
  loc?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  suggest?: SuggestionDescriptor[]
  fix?: (fixer: RuleFixer) => unknown
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
      url?: string
    }
    schema: unknown[]
    messages: Record<string, string>
    hasSuggestions?: boolean
    fixable?: 'code' | 'whitespace'
  }
  create: (context: RuleContextWithReport) => Record<string, () => void>
}

export type Inspect = (context: LintRuleContextLike) => FileInspectionResult | undefined

/** UTF-8 byte offset (Panda spans) → string index (ESLint fix ranges). */
export function byteToIndex(text: string, byteOffset: number): number {
  let bytes = 0
  for (let i = 0; i < text.length; ) {
    if (bytes >= byteOffset) return i
    const cp = text.codePointAt(i) as number
    bytes += cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4
    i += cp > 0xffff ? 2 : 1
  }
  return text.length
}

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
