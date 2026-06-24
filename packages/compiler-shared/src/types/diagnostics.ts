export interface Span {
  start: number
  end: number
}

/** 1-indexed line, 1-indexed UTF-16 column — matches `tsc`/editor reporting. */
export interface SourceLocation {
  line: number
  column: number
}

export interface SourceRange {
  start: SourceLocation
  end: SourceLocation
}

export interface DiagnosticLabel {
  message?: string
  /** UTF-8 byte offsets. */
  span?: Span
  location?: SourceRange
}

export type DiagnosticSeverity = 'info' | 'warning' | 'error'

export interface Diagnostic {
  code: string
  message: string
  severity: DiagnosticSeverity
  file?: string
  category?: string
  /** UTF-8 byte offsets. */
  span?: Span
  location?: SourceRange
  labels?: DiagnosticLabel[]
  help?: string[]
}
