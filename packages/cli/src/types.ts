import type { BuildInfo, Driver, ParseFileReport, TraceOptions } from '@pandacss/compiler'
import type { DiagnosticFormat } from './diagnostics'
import type { OutputSink } from './output'
import type { CliResult } from './result'

export interface CommonFlags {
  cwd?: string
  config?: string
  watch?: boolean
  silent?: boolean
  json?: boolean
  format?: DiagnosticFormat
  quiet?: boolean
  maxWarnings?: number | string
  verbose?: boolean
  logfile?: string
  trace?: boolean
  traceOutput?: TraceOptions['output']
  traceFile?: string
  watchDebounce?: number | string
}

export interface CodegenFlags extends CommonFlags {
  outdir?: string
  check?: boolean
}

export interface CssgenFlags extends CommonFlags {
  outfile?: string
  splitting?: boolean
  check?: boolean
}

/** Flags for `panda buildinfo` — produce a portable `panda.buildinfo.json`. */
export interface BuildinfoFlags extends Omit<CommonFlags, 'watch' | 'watchDebounce'> {
  outfile?: string
  panda?: string
  minify?: boolean
}

export interface BuildinfoResult extends CommandResult {
  outfile?: string
  buildInfo?: BuildInfo
  moduleCount: number
  atomCount: number
  recipeCount: number
  bytes: number
}

export interface InspectFlags
  extends Pick<
    CommonFlags,
    | 'cwd'
    | 'config'
    | 'format'
    | 'quiet'
    | 'maxWarnings'
    | 'verbose'
    | 'logfile'
    | 'trace'
    | 'traceOutput'
    | 'traceFile'
  > {
  json?: boolean
}

export interface ValidateFlags
  extends Pick<
    CommonFlags,
    | 'cwd'
    | 'config'
    | 'json'
    | 'format'
    | 'quiet'
    | 'maxWarnings'
    | 'silent'
    | 'verbose'
    | 'logfile'
    | 'trace'
    | 'traceOutput'
    | 'traceFile'
  > {}

export interface CommandContext {
  cwd: string
}

export interface CommandResult extends CliResult {
  driver?: Driver
  stop?: () => Promise<void>
}

export interface CodegenResult extends CommandResult {
  outdir?: string
  files: string[]
  missing: string[]
  stale: string[]
}

export interface CssgenResult extends CommandResult {
  outfile?: string
  parsed: ParseFileReport[]
  cssBytes: number
  diagnosticCount: number
  missing: string[]
  stale: string[]
}

export interface InspectResult extends CliResult {
  configPath?: string
  sourceCount: number
  watchDirs: string[]
  artifactIds: string[]
  conditionCount: number
  tokenCategoryCount: number
  utilityCount: number
}

export interface ValidateResult extends CommandResult {
  configPath?: string
  diagnosticCount: number
  errors: number
}

export interface RunContext {
  driver: Driver
  cwd: string
  outdir: string
  output: OutputSink
  timings?: PhaseTimings
}

export interface CheckOutput {
  files: string[]
  missing: string[]
  stale: string[]
}

export type InspectSummary = Omit<InspectResult, keyof CliResult>
export type PhaseTimings = Record<string, number>
