import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import type { Diagnostic, ParseFileReport } from '@pandacss/compiler'

export type DiagnosticFormat = 'human' | 'pretty' | 'json' | 'github'

export interface CliDiagnostic extends Diagnostic {
  file?: string
}

export interface DiagnosticRenderOptions {
  cwd: string
  format?: DiagnosticFormat
  quiet?: boolean
}

export function withDiagnosticFile(diagnostic: Diagnostic, file?: string): CliDiagnostic {
  return file ? { ...diagnostic, file } : diagnostic
}

export function normalizeDiagnostics(
  diagnostics: Diagnostic[],
  options: { cwd: string; file?: string },
): CliDiagnostic[] {
  return dedupeDiagnostics(
    diagnostics.map((diagnostic) => {
      const file = diagnostic.file ?? options.file
      return {
        ...diagnostic,
        file: file ? stabilizePath(options.cwd, file) : undefined,
      }
    }),
  )
}

export function collectParseDiagnostics(parsed: ParseFileReport[], cwd: string): CliDiagnostic[] {
  return parsed.flatMap((report) => normalizeDiagnostics(report.diagnostics, { cwd, file: report.path }))
}

export function configLoadDiagnostic(error: unknown, options: { cwd: string; file?: string }): CliDiagnostic {
  const diagnostics = pandaErrorDiagnostics(error)
  if (diagnostics.length > 0) {
    return normalizeDiagnostics(diagnostics, options)[0]
  }

  return normalizeDiagnostics(
    [
      {
        code: 'config_load_error',
        severity: 'error',
        message: errorMessage(error),
        category: 'config',
        help: ['Check that the config path exists and can be bundled.'],
      },
    ],
    options,
  )[0]
}

export function configLoadDiagnostics(error: unknown, options: { cwd: string; file?: string }): CliDiagnostic[] {
  const diagnostics = pandaErrorDiagnostics(error)
  if (diagnostics.length > 0) return normalizeDiagnostics(diagnostics, options)

  return [configLoadDiagnostic(error, options)]
}

export function missingConfigDiagnostic(configPath: string | undefined, cwd: string): CliDiagnostic | undefined {
  if (!configPath) return undefined

  const filePath = isAbsolute(configPath) ? configPath : resolve(cwd, configPath)

  if (existsSync(filePath)) return undefined

  return normalizeDiagnostics(
    [
      {
        code: 'config_load_error',
        severity: 'error',
        message: `Cannot resolve config file ${configPath}.`,
        category: 'config',
        help: ['Check that the config path exists and can be bundled.'],
      },
    ],
    { cwd, file: configPath },
  )[0]
}

export function renderDiagnostics(diagnostics: Diagnostic[], options: DiagnosticRenderOptions): string {
  const normalized = normalizeDiagnostics(diagnostics, { cwd: options.cwd })
  const visible = options.quiet ? normalized.filter((diagnostic) => diagnostic.severity === 'error') : normalized

  if (visible.length === 0) return ''

  switch (options.format) {
    case 'github':
      return visible.map(formatGithubDiagnostic).join('\n')
    case 'pretty':
      return visible.map((diagnostic) => formatPrettyDiagnostic(diagnostic, options.cwd)).join('\n\n')
    case 'json':
      return JSON.stringify(visible, null, 2)
    case 'human':
    default:
      return visible.map(formatDiagnostic).join('\n')
  }
}

export function formatDiagnostic(diagnostic: CliDiagnostic): string {
  const location = diagnostic.location
    ? ` ${diagnostic.file ?? '<unknown>'}:${diagnostic.location.start.line}:${diagnostic.location.start.column}`
    : diagnostic.file
      ? ` ${diagnostic.file}`
      : ''

  return `${diagnostic.severity} ${diagnostic.code}${location} ${diagnostic.message}`
}

export function countErrors(diagnostics: Diagnostic[]): number {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
}

export function countWarnings(diagnostics: Diagnostic[]): number {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
}

export function diagnosticsPass(diagnostics: Diagnostic[], maxWarningsValue?: number | string): boolean {
  if (countErrors(diagnostics) > 0) return false

  const maxWarnings = parseMaxWarnings(maxWarningsValue)

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

function formatPrettyDiagnostic(diagnostic: CliDiagnostic, cwd: string): string {
  const header = `${diagnostic.severity} ${diagnostic.code}: ${diagnostic.message}`
  if (!diagnostic.file || !diagnostic.location) return formatDiagnostic(diagnostic)

  const filePath = isAbsolute(diagnostic.file) ? diagnostic.file : resolve(cwd, diagnostic.file)

  if (!existsSync(filePath)) return formatDiagnostic(diagnostic)

  const lineNumber = diagnostic.location.start.line
  const line = readFileSync(filePath, 'utf8').split(/\r?\n/)[lineNumber - 1]

  if (line == null) return formatDiagnostic(diagnostic)

  const startColumn = Math.max(1, diagnostic.location.start.column)
  const endColumn =
    diagnostic.location.end.line === diagnostic.location.start.line
      ? Math.max(startColumn + 1, diagnostic.location.end.column)
      : startColumn + 1
  const marker = `${' '.repeat(String(lineNumber).length)} │ ${' '.repeat(startColumn - 1)}${'^'.repeat(
    Math.max(1, endColumn - startColumn),
  )}`
  const details = [`  ┌─ ${diagnostic.file}:${lineNumber}:${startColumn}`, `  │`, `${lineNumber} │ ${line}`, marker]

  for (const help of diagnostic.help ?? []) {
    details.push(`  = help: ${help}`)
  }

  return [header, ...details].join('\n')
}

function formatGithubDiagnostic(diagnostic: CliDiagnostic): string {
  const command = diagnostic.severity === 'error' ? 'error' : 'warning'
  const props = [
    diagnostic.file ? `file=${escapeGithubProperty(diagnostic.file)}` : undefined,
    diagnostic.location ? `line=${diagnostic.location.start.line}` : undefined,
    diagnostic.location ? `col=${diagnostic.location.start.column}` : undefined,
    `title=${escapeGithubProperty(diagnostic.code)}`,
  ].filter(Boolean)

  return `::${command} ${props.join(',')}::${escapeGithubMessage(diagnostic.message)}`
}

function stabilizePath(cwd: string, file: string): string {
  if (!isAbsolute(file)) return file

  const relativePath = relative(cwd, file)

  return relativePath && !relativePath.startsWith('..') ? relativePath : file
}

function diagnosticKey(diagnostic: Diagnostic): string {
  return [diagnostic.file ?? '', diagnosticKeyWithoutFile(diagnostic)].join('|')
}

function diagnosticKeyWithoutFile(diagnostic: Diagnostic): string {
  const location = diagnostic.location
    ? `${diagnostic.location.start.line}:${diagnostic.location.start.column}:${diagnostic.location.end.line}:${diagnostic.location.end.column}`
    : ''
  const span = diagnostic.span ? `${diagnostic.span.start}:${diagnostic.span.end}` : ''
  return [diagnostic.code, diagnostic.message, diagnostic.severity, location, span].join('|')
}

function escapeGithubProperty(value: string): string {
  return value
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/,/g, '%2C')
    .replace(/:/g, '%3A')
}

function escapeGithubMessage(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
}

function parseMaxWarnings(value: number | string | undefined): number | undefined {
  if (value === undefined) return undefined

  const number = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(number) ? number : undefined
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return stripAnsi(error.message).replace(/\s+/g, ' ').trim()

  return stripAnsi(String(error)).replace(/\s+/g, ' ').trim()
}

function pandaErrorDiagnostics(error: unknown): Diagnostic[] {
  if (typeof error !== 'object' || error === null || !('diagnostics' in error)) return []

  const diagnostics = (error as { diagnostics?: unknown }).diagnostics
  if (!Array.isArray(diagnostics)) return []

  return diagnostics.filter(isDiagnostic)
}

function isDiagnostic(value: unknown): value is Diagnostic {
  if (typeof value !== 'object' || value === null) return false
  const diagnostic = value as Partial<Diagnostic>
  return (
    typeof diagnostic.code === 'string' &&
    typeof diagnostic.message === 'string' &&
    (diagnostic.severity === 'info' || diagnostic.severity === 'warning' || diagnostic.severity === 'error')
  )
}

function stripAnsi(value: string): string {
  return value.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'), '')
}
