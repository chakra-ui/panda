import type { Diagnostic, ParseFileReport } from './types'

export interface NormalizeDiagnosticsOptions {
  file?: string
  normalizeFile?: (file: string) => string
}

export interface DiagnosticsPassOptions {
  maxWarnings?: number | string
}

export function withDiagnosticFile<T extends Diagnostic>(diagnostic: T, file?: string): T {
  return file ? ({ ...diagnostic, file } as T) : diagnostic
}

/** Compact one-line rendering (`severity code file:line:col message`) for build-plugin logs. */
export function formatDiagnostic(diagnostic: Diagnostic): string {
  const file = diagnostic.file ?? ''
  const location = diagnostic.location
    ? `:${diagnostic.location.start.line}:${diagnostic.location.start.column}`
    : diagnostic.span
      ? `:${diagnostic.span.start}`
      : ''
  return `${diagnostic.severity} ${diagnostic.code} ${file}${location} ${diagnostic.message}`.replace(/\s+/g, ' ')
}

export function normalizeDiagnostics<T extends Diagnostic>(
  diagnostics: T[],
  options: NormalizeDiagnosticsOptions = {},
): T[] {
  return dedupeDiagnostics(
    diagnostics.map((diagnostic) => {
      const file = diagnostic.file ?? options.file
      const normalizedFile = file && options.normalizeFile ? options.normalizeFile(file) : file
      return normalizedFile ? ({ ...diagnostic, file: normalizedFile } as T) : diagnostic
    }),
  )
}

export function collectParseDiagnostics(
  reports: ParseFileReport[],
  options: Omit<NormalizeDiagnosticsOptions, 'file'> = {},
): Diagnostic[] {
  return reports.flatMap((report) => normalizeDiagnostics(report.diagnostics, { ...options, file: report.path }))
}

export function countErrors(diagnostics: Diagnostic[]): number {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
}

export function countWarnings(diagnostics: Diagnostic[]): number {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
}

export function diagnosticsPass(diagnostics: Diagnostic[], options: DiagnosticsPassOptions = {}): boolean {
  if (countErrors(diagnostics) > 0) return false

  const maxWarnings = parseMaxWarnings(options.maxWarnings)
  if (maxWarnings === undefined) return true

  return countWarnings(diagnostics) <= maxWarnings
}

export function dedupeDiagnostics<T extends Diagnostic>(diagnostics: T[]): T[] {
  const fileBackedKeys = new Set(diagnostics.filter((diagnostic) => diagnostic.file).map(diagnosticKeyWithoutFile))
  const seen = new Set<string>()
  const result: T[] = []

  for (const diagnostic of diagnostics) {
    if (!diagnostic.file && fileBackedKeys.has(diagnosticKeyWithoutFile(diagnostic))) continue

    const key = diagnosticKey(diagnostic)
    if (seen.has(key)) continue

    seen.add(key)
    result.push(diagnostic)
  }

  return result
}

export function diagnosticKey(diagnostic: Diagnostic): string {
  return [diagnostic.file ?? '', diagnosticKeyWithoutFile(diagnostic)].join('|')
}

export function diagnosticKeyWithoutFile(diagnostic: Diagnostic): string {
  const location = diagnostic.location
    ? `${diagnostic.location.start.line}:${diagnostic.location.start.column}:${diagnostic.location.end.line}:${diagnostic.location.end.column}`
    : ''
  const span = diagnostic.span ? `${diagnostic.span.start}:${diagnostic.span.end}` : ''
  return [diagnostic.code, diagnostic.message, diagnostic.severity, location, span].join('|')
}

function parseMaxWarnings(value: number | string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined

  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : undefined
}
