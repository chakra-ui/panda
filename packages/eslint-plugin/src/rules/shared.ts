import type { FileInspectionResult, SourceRange, Span } from '@pandacss/compiler'
import type { LintRuleContextLike } from '../core'

export interface RuleTextEdit {
  range: [number, number]
  text: string
}

export interface RuleFixer {
  replaceTextRange(range: [number, number], text: string): RuleTextEdit
}

export interface SuggestionDescriptor {
  desc: string
  fix: (fixer: RuleFixer) => RuleTextEdit | null
}

export interface ReportDescriptor {
  messageId: string
  data?: Record<string, string>
  // Required: ESLint throws when a report has neither `node` nor `loc`.
  loc: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  suggest?: SuggestionDescriptor[]
  fix?: (fixer: RuleFixer) => RuleTextEdit | null
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

/** Full source text from a rule context (ESLint exposes `.text`, oxlint `getText()`). */
export function getSourceText(context: RuleContextWithReport): string {
  return context.sourceCode?.text ?? context.sourceCode?.getText?.() ?? ''
}

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

/** For file-level reports with no source range. */
export const FILE_START_LOC: ReportDescriptor['loc'] = { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } }

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

export interface SourceIndex {
  text: string
  index: (byteOffset: number) => number
  slice: (span: Span) => string
  loc: (index: number) => ReportDescriptor['loc']['start']
}

function lastAtOrBelow(sorted: ArrayLike<number>, value: number): number {
  let low = 0
  let high = sorted.length - 1
  while (low < high) {
    const mid = (low + high + 1) >> 1
    if (sorted[mid] <= value) low = mid
    else high = mid - 1
  }
  return low
}

function byteIndexer(text: string): (byteOffset: number) => number {
  if (!/[\u0080-\uffff]/.test(text)) return (byteOffset) => Math.min(Math.max(byteOffset, 0), text.length)

  const byteAt = new Float64Array(text.length + 1)
  let bytes = 0
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i) as number
    byteAt[i] = bytes
    if (cp > 0xffff) byteAt[i + 1] = bytes
    bytes += cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4
    i += cp > 0xffff ? 2 : 1
  }
  byteAt[text.length] = bytes

  return (byteOffset) => {
    if (byteOffset <= 0) return 0
    if (byteOffset >= bytes) return text.length
    let i = lastAtOrBelow(byteAt, byteOffset)
    if (byteAt[i] !== byteOffset) return i + 1
    while (i > 0 && byteAt[i - 1] === byteOffset) i--
    return i
  }
}

function lineStarts(text: string): number[] {
  const starts = [0]
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code === 13 && text.charCodeAt(i + 1) === 10) i++
    if (code === 10 || code === 13 || code === 0x2028 || code === 0x2029) starts.push(i + 1)
  }
  return starts
}

export function createSourceIndex(text: string): SourceIndex {
  const index = byteIndexer(text)
  let starts: number[] | undefined
  return {
    text,
    index,
    slice: (span) => text.slice(index(span.start), index(span.end)),
    loc(position) {
      starts ??= lineStarts(text)
      const line = lastAtOrBelow(starts, position)
      return { line: line + 1, column: position - starts[line] }
    },
  }
}
