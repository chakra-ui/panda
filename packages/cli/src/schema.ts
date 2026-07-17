import type { BuildInfoArtifact, Driver, NodeDriver, ParseFileReport, TraceOptions } from '@pandacss/compiler'
import type { UsageReport } from '@pandacss/compiler-shared'
import type { OutputSink } from './output'
import type { CliResult } from './result'
import {
  bool,
  enumOf,
  type EnumValues,
  type FlagsInfer,
  object,
  str,
  stringOrArray,
  stringOrNumber,
} from './flags-schema'

export const logLevelSchema = enumOf(['silent', 'error', 'warn', 'info', 'debug'])
export const diagnosticFormatSchema = enumOf(['human', 'pretty', 'json', 'github'])
export const traceOutputSchema = enumOf(['fmt', 'chrome-json'] satisfies readonly TraceOptions['output'][])

const booleanFlag = bool()
const stringFlag = str()
const numberLikeFlag = stringOrNumber()

export const commonFlagsSchema = object({
  cwd: stringFlag,
  config: stringFlag,
  include: stringOrArray(),
  watch: booleanFlag,
  json: booleanFlag,
  format: diagnosticFormatSchema,
  logLevel: logLevelSchema,
  maxWarnings: numberLikeFlag,
  logfile: stringFlag,
  profile: booleanFlag,
  trace: booleanFlag,
  traceOutput: traceOutputSchema,
  traceFile: stringFlag,
  watchDebounce: numberLikeFlag,
})

export const codegenFlagsSchema = commonFlagsSchema.extend({
  outdir: stringFlag,
  clean: booleanFlag,
  check: booleanFlag,
})

export const cssgenFlagsSchema = commonFlagsSchema.extend({
  outfile: stringFlag,
  splitting: booleanFlag,
  check: booleanFlag,
  minimal: booleanFlag,
  minify: booleanFlag,
})

export const buildFlagsSchema = commonFlagsSchema.extend({
  outdir: stringFlag,
  outfile: stringFlag,
  splitting: booleanFlag,
  clean: booleanFlag,
  check: booleanFlag,
})

export const initFlagsSchema = commonFlagsSchema
  .omit({
    watch: true,
    watchDebounce: true,
    maxWarnings: true,
    profile: true,
    trace: true,
    traceOutput: true,
    traceFile: true,
  })
  .extend({
    force: booleanFlag,
    postcss: booleanFlag,
    gitignore: booleanFlag,
    codegen: booleanFlag,
    outExtension: enumOf(['ts', 'js', 'mjs']),
    outdir: stringFlag,
    jsxFramework: stringFlag,
    syntax: enumOf(['template-literal', 'object-literal']),
    strictTokens: booleanFlag,
    install: booleanFlag,
  })

export const buildinfoFlagsSchema = commonFlagsSchema.omit({ watch: true, watchDebounce: true }).extend({
  outfile: stringFlag,
  panda: stringFlag,
  minify: booleanFlag,
})

export const libFlagsSchema = commonFlagsSchema.extend({
  outdir: stringFlag,
  panda: stringFlag,
  files: stringOrArray(),
  minify: booleanFlag,
})

export const infoFlagsSchema = commonFlagsSchema.pick({
  cwd: true,
  config: true,
  include: true,
  json: true,
  format: true,
  logLevel: true,
  maxWarnings: true,
  logfile: true,
  profile: true,
  trace: true,
  traceOutput: true,
  traceFile: true,
})

// `doctor` validates config/diagnostics and never scans sources, so it must not
// inherit `--include` from the shared info schema.
export const doctorFlagsSchema = infoFlagsSchema.omit({ include: true })

export const debugFlagsSchema = infoFlagsSchema.extend({
  outdir: stringFlag,
  dry: booleanFlag,
  onlyConfig: booleanFlag,
})

export const studioGenerateFlagsSchema = commonFlagsSchema.extend({
  outdir: stringFlag,
})

export const studioServeFlagsSchema = commonFlagsSchema.extend({
  port: numberLikeFlag,
  host: stringFlag,
})

export const analyzeFlagsSchema = commonFlagsSchema.extend({
  // Scope to include in the report: all, tokens, recipes, utilities, patterns, keyframes (or token/recipe aliases)
  scope: enumOf(['all', 'tokens', 'recipes', 'utilities', 'patterns', 'keyframes', 'token', 'recipe']),
  outfile: stringFlag,
  report: stringFlag,
  limit: numberLikeFlag,
  ui: booleanFlag,
  uiHost: stringFlag,
  uiPort: numberLikeFlag,
})

export type LogLevel = EnumValues<typeof logLevelSchema>
export type CommonFlags = FlagsInfer<typeof commonFlagsSchema>
export type CodegenFlags = FlagsInfer<typeof codegenFlagsSchema>
export type CssgenFlags = FlagsInfer<typeof cssgenFlagsSchema>
export type BuildFlags = FlagsInfer<typeof buildFlagsSchema>
export type InitFlags = FlagsInfer<typeof initFlagsSchema>
export type BuildinfoFlags = FlagsInfer<typeof buildinfoFlagsSchema>
export type LibFlags = FlagsInfer<typeof libFlagsSchema>
export type StudioGenerateFlags = FlagsInfer<typeof studioGenerateFlagsSchema>
export type StudioServeFlags = FlagsInfer<typeof studioServeFlagsSchema>
export type InfoFlags = FlagsInfer<typeof infoFlagsSchema>
export type DoctorFlags = FlagsInfer<typeof doctorFlagsSchema>
export type DebugFlags = FlagsInfer<typeof debugFlagsSchema>
type AnalyzeScopeRaw = FlagsInfer<typeof analyzeFlagsSchema>['scope']
export type AnalyzeScope = NonNullable<Exclude<AnalyzeScopeRaw, 'token' | 'recipe'>>
export type AnalyzeFlags = FlagsInfer<typeof analyzeFlagsSchema>

export interface BuildinfoResult extends CommandResult {
  outfile?: string
  buildInfo?: BuildInfoArtifact
  moduleCount: number
  atomCount: number
  recipeCount: number
  bytes: number
}

export interface LibResult extends CommandResult<NodeDriver> {
  manifestPath?: string
  buildInfoPath?: string
  presetPath?: string
  exportsChanged: boolean
}

export interface StudioGenerateResult extends CommandResult {
  outdir?: string
  files: string[]
  framework: string
}

export interface StudioServeResult extends CommandResult<NodeDriver> {
  url?: string
}

export interface CommandResult<TDriver extends Driver = Driver> extends CliResult {
  driver?: TDriver
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

export interface BuildResult extends CommandResult {
  outdir?: string
  outfile?: string
  files: string[]
  parsed: ParseFileReport[]
  cssBytes: number
  diagnosticCount: number
  missing: string[]
  stale: string[]
}

export interface AnalyzeResult extends CommandResult, UsageReport {
  scope: AnalyzeScope
  report?: string
  ui?: string
}

export interface DebugResult extends CommandResult {
  outdir?: string
  /** Debug files written (or, in `--dry`, the files that would be written). */
  files: string[]
  sourceCount: number
}

export interface InitResult extends CommandResult {
  configPath: string
  outdir: string
  configWritten: boolean
  postcssWritten: boolean
  gitignoreWritten: boolean
  codegenFiles: string[]
  presetsInstalled: string[]
}

export interface InfoResult extends CliResult {
  configPath?: string
  sourceCount: number
  watchDirs: string[]
  artifactIds: string[]
  conditionCount: number
  tokenCategoryCount: number
  utilityCount: number
}

export interface DoctorResult extends CommandResult {
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

export type InfoSummary = Omit<InfoResult, keyof CliResult>
export type PhaseTimings = Record<string, number>
