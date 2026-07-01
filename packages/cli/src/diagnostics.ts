import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import {
  collectParseDiagnostics,
  normalizeDiagnostics,
  type Diagnostic,
  type ParseFileReport,
} from '@pandacss/compiler-shared'

export type DiagnosticFormat = 'human' | 'pretty' | 'json' | 'github'

export interface DiagnosticRenderOptions {
  cwd: string
  format?: DiagnosticFormat
  quiet?: boolean
}

export function normalizeCliDiagnostics(
  diagnostics: Diagnostic[],
  options: { cwd: string; file?: string },
): Diagnostic[] {
  return normalizeDiagnostics(diagnostics, {
    file: options.file,
    normalizeFile: (file) => stabilizePath(options.cwd, file),
  })
}

export function collectCliParseDiagnostics(parsed: ParseFileReport[], cwd: string): Diagnostic[] {
  return collectParseDiagnostics(parsed, { normalizeFile: (file) => stabilizePath(cwd, file) })
}

export function configLoadDiagnostic(error: unknown, options: { cwd: string; file?: string }): Diagnostic {
  const diagnostics = pandaErrorDiagnostics(error)
  if (diagnostics.length > 0) {
    return normalizeCliDiagnostics(diagnostics, options)[0]
  }

  return normalizeCliDiagnostics(
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

export function configLoadDiagnostics(error: unknown, options: { cwd: string; file?: string }): Diagnostic[] {
  const diagnostics = pandaErrorDiagnostics(error)
  if (diagnostics.length > 0) return normalizeCliDiagnostics(diagnostics, options)

  return [configLoadDiagnostic(error, options)]
}

export function missingConfigDiagnostic(configPath: string | undefined, cwd: string): Diagnostic | undefined {
  if (!configPath) return undefined

  const filePath = isAbsolute(configPath) ? configPath : resolve(cwd, configPath)

  if (existsSync(filePath)) return undefined

  return normalizeCliDiagnostics(
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
  const normalized = normalizeCliDiagnostics(diagnostics, { cwd: options.cwd })
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

export function formatDiagnostic(diagnostic: Diagnostic): string {
  const location = diagnostic.location
    ? ` ${diagnostic.file ?? '<unknown>'}:${diagnostic.location.start.line}:${diagnostic.location.start.column}`
    : diagnostic.file
      ? ` ${diagnostic.file}`
      : ''

  return `${diagnostic.severity} ${diagnostic.code}${location} ${diagnostic.message}`
}

function formatPrettyDiagnostic(diagnostic: Diagnostic, cwd: string): string {
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

function formatGithubDiagnostic(diagnostic: Diagnostic): string {
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
