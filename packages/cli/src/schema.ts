import type { BuildInfoArtifact, Driver, ParseFileReport, TraceOptions } from '@pandacss/compiler'
import type { UsageReport } from '@pandacss/compiler-shared'
import type { OutputSink } from './output'
import type { CliResult } from './result'
import { z } from 'zod'

export const logLevelSchema = z.enum(['silent', 'error', 'warn', 'info', 'debug'])
export const diagnosticFormatSchema = z.enum(['human', 'pretty', 'json', 'github'])
export const traceOutputSchema = z.enum(['fmt', 'chrome-json']) satisfies z.ZodType<TraceOptions['output']>

const booleanFlag = z.boolean().optional()
const stringFlag = z.string().optional()
const numberLikeFlag = z.union([z.string(), z.number()]).optional()

export const commonFlagsSchema = z.object({
  cwd: stringFlag,
  config: stringFlag,
  include: z.union([z.string(), z.array(z.string())]).optional(),
  watch: booleanFlag,
  json: booleanFlag,
  format: diagnosticFormatSchema.optional(),
  logLevel: logLevelSchema.optional(),
  maxWarnings: numberLikeFlag,
  logfile: stringFlag,
  trace: booleanFlag,
  traceOutput: traceOutputSchema.optional(),
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
  .omit({ watch: true, watchDebounce: true, maxWarnings: true, trace: true, traceOutput: true, traceFile: true })
  .extend({
    force: booleanFlag,
    postcss: booleanFlag,
    gitignore: booleanFlag,
    codegen: booleanFlag,
    outExtension: z.enum(['ts', 'js', 'mjs']).optional(),
    outdir: stringFlag,
    jsxFramework: stringFlag,
    syntax: z.enum(['template-literal', 'object-literal']).optional(),
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
  files: z.union([z.string(), z.array(z.string())]).optional(),
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

export const analyzeFlagsSchema = commonFlagsSchema.extend({
  scope: z
    .enum(['all', 'tokens', 'recipes', 'utilities', 'patterns', 'keyframes', 'token', 'recipe'])
    .optional()
    .describe(
      'Scope to include in the report: all, tokens, recipes, utilities, patterns, keyframes (or token/recipe aliases)',
    ),
  outfile: stringFlag,
  report: stringFlag,
  limit: numberLikeFlag,
  ui: booleanFlag,
  uiHost: stringFlag,
  uiPort: numberLikeFlag,
})

export type LogLevel = z.infer<typeof logLevelSchema>
export type CommonFlags = z.infer<typeof commonFlagsSchema>
export type CodegenFlags = z.infer<typeof codegenFlagsSchema>
export type CssgenFlags = z.infer<typeof cssgenFlagsSchema>
export type BuildFlags = z.infer<typeof buildFlagsSchema>
export type InitFlags = z.infer<typeof initFlagsSchema>
export type BuildinfoFlags = z.infer<typeof buildinfoFlagsSchema>
export type LibFlags = z.infer<typeof libFlagsSchema>
export type InfoFlags = z.infer<typeof infoFlagsSchema>
export type DoctorFlags = z.infer<typeof doctorFlagsSchema>
export type DebugFlags = z.infer<typeof debugFlagsSchema>
type AnalyzeScopeRaw = z.infer<typeof analyzeFlagsSchema>['scope']
export type AnalyzeScope = NonNullable<Exclude<AnalyzeScopeRaw, 'token' | 'recipe'>>
export type AnalyzeFlags = z.infer<typeof analyzeFlagsSchema>

export interface BuildinfoResult extends CommandResult {
  outfile?: string
  buildInfo?: BuildInfoArtifact
  moduleCount: number
  atomCount: number
  recipeCount: number
  bytes: number
}

export interface LibResult extends CommandResult {
  manifestPath?: string
  buildInfoPath?: string
  presetPath?: string
  exportsChanged: boolean
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
