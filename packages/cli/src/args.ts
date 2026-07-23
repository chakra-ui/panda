import type { ArgsDef } from 'citty'
import type { FlagsInfer, FlagsSchema, Issue, ParseResult, Shape } from './flags-schema'

export function baseArgs(): ArgsDef {
  return {
    cwd: { type: 'string', description: 'Current working directory', default: process.cwd() },
    config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
  }
}

export function outputArgs(): ArgsDef {
  return {
    json: { type: 'boolean', description: 'Print JSON' },
    format: { type: 'string', description: 'Diagnostic output format: human, pretty, json, or github' },
    'log-level': {
      type: 'string',
      valueHint: 'level',
      description: 'Set output level: silent, error, warn, info, or debug',
    },
    'max-warnings': { type: 'string', description: 'Fail when warning diagnostics exceed this count' },
    logfile: { type: 'string', description: 'Write human output to a log file' },
    color: { type: 'boolean', description: 'Disable ANSI colors in human output', default: true },
  }
}

export function includeArgs(): ArgsDef {
  return {
    include: {
      type: 'string',
      valueHint: 'glob',
      description: 'Source file globs to scan, replacing the config include list',
    },
  }
}

/** Normalize `--include` (string, repeated array, or comma-separated) into a glob list. */
export function normalizeInclude(value: unknown): string[] | undefined {
  if (value == null) return undefined

  const globs = (Array.isArray(value) ? value : [value])
    .flatMap((entry) => String(entry).split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)

  return globs.length > 0 ? globs : undefined
}

export function traceArgs(): ArgsDef {
  return {
    profile: { type: 'boolean', description: 'Capture Rust compiler timings (trace.json, timings.json)' },
    trace: { type: 'boolean', description: 'Enable compiler tracing' },
    'trace-output': { type: 'string', description: 'Trace output: fmt or chrome-json' },
    'trace-file': { type: 'string', description: 'Trace output file for chrome-json tracing' },
  }
}

export function runtimeArgs(): ArgsDef {
  return {
    ...baseArgs(),
    ...outputArgs(),
    ...traceArgs(),
  }
}

export function parseCliFlags<TSchema extends FlagsSchema<Shape>>(schema: TSchema, args: unknown): FlagsInfer<TSchema> {
  const flags = normalizeCliFlags(args)
  // `schema`'s member access resolves through the `FlagsSchema<Shape>` bound, not
  // the caller's concrete shape — bridge back to the precise inferred type here.
  const result = schema.safeParse(flags) as ParseResult<FlagsInfer<TSchema>>

  if (result.success) return result.data

  console.error(
    ['[error] Invalid command options', ...result.error.issues.map((issue) => `- ${formatIssue(issue, flags)}`)].join(
      '\n',
    ),
  )
  process.exit(1)
}

export function normalizeCliFlags(args: unknown): Record<string, unknown> {
  const source = args && typeof args === 'object' ? args : {}
  const flags = { ...source } as Record<string, unknown>

  if (flags['log-level'] !== undefined && flags.logLevel === undefined) flags.logLevel = flags['log-level']
  if (flags['max-warnings'] !== undefined && flags.maxWarnings === undefined) flags.maxWarnings = flags['max-warnings']
  if (flags['trace-output'] !== undefined && flags.traceOutput === undefined) flags.traceOutput = flags['trace-output']
  if (flags['trace-file'] !== undefined && flags.traceFile === undefined) flags.traceFile = flags['trace-file']
  if (flags['watch-debounce'] !== undefined && flags.watchDebounce === undefined) {
    flags.watchDebounce = flags['watch-debounce']
  }
  if (flags['ui-host'] !== undefined && flags.uiHost === undefined) flags.uiHost = flags['ui-host']
  if (flags['ui-port'] !== undefined && flags.uiPort === undefined) flags.uiPort = flags['ui-port']
  if (flags.color === false && flags.noColor === undefined) flags.noColor = true
  // Preserve kebab-case flags passed through the programmatic API.
  if (flags['no-color'] !== undefined && flags.noColor === undefined) flags.noColor = flags['no-color']
  if (flags['jsx-style-props'] !== undefined && flags.jsxStyleProps === undefined) {
    flags.jsxStyleProps = flags['jsx-style-props']
  }
  if (flags['out-extension'] !== undefined && flags.outExtension === undefined) {
    flags.outExtension = flags['out-extension']
  }
  if (flags['jsx-framework'] !== undefined && flags.jsxFramework === undefined) {
    flags.jsxFramework = flags['jsx-framework']
  }
  if (flags['strict-tokens'] !== undefined && flags.strictTokens === undefined) {
    flags.strictTokens = flags['strict-tokens']
  }
  if (flags['skip-presets'] !== undefined && flags.skipPresets === undefined) {
    flags.skipPresets = flags['skip-presets']
  }

  return omitKeys(flags, [
    'log-level',
    'max-warnings',
    'trace-output',
    'trace-file',
    'watch-debounce',
    'ui-host',
    'ui-port',
    'color',
    'no-color',
    'jsx-style-props',
    'out-extension',
    'jsx-framework',
    'strict-tokens',
    'skip-presets',
  ])
}

function omitKeys<T extends Record<string, unknown>>(value: T, keys: string[]): T {
  for (const key of keys) {
    delete value[key]
  }
  return value
}

function flagName(path: PropertyKey | undefined): string {
  if (path === undefined) return '<option>'

  return `--${String(path).replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`
}

function formatIssue(issue: Issue, flags: Record<string, unknown>): string {
  const path = issue.path[0]
  const name = flagName(path)
  const received = path === undefined ? undefined : flags[String(path)]

  if (issue.code === 'invalid_value' && 'values' in issue && Array.isArray(issue.values)) {
    return `${name}: expected ${formatList(issue.values)}${formatReceived(received)}`
  }

  return `${name}: ${issue.message}${formatReceived(received)}`
}

function formatList(values: unknown[]): string {
  const labels = values.map((value) => String(value))

  if (labels.length <= 1) return labels[0] ?? '<unknown>'
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`

  return `${labels.slice(0, -1).join(', ')}, or ${labels.at(-1)}`
}

function formatReceived(value: unknown): string {
  if (value === undefined) return ''

  return ` (received ${JSON.stringify(value)})`
}
