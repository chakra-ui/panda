import { join } from 'node:path'
import { createNodeDriver, type ConfigDiff, type Driver, type ParseFileReport } from '@pandacss/compiler'
import {
  consoleOutput,
  formatDiagnostics,
  resolveCwd,
  resolveFile,
  resolveOutdir,
  writeTextFile,
  type OutputSink,
} from './io'
import { startProjectWatch } from './watch'

export interface CommonFlags {
  cwd?: string
  config?: string
  watch?: boolean
  silent?: boolean
}

export interface CodegenFlags extends CommonFlags {
  outdir?: string
}

export interface CssgenFlags extends CommonFlags {
  outfile?: string
}

export interface InspectFlags extends Pick<CommonFlags, 'cwd' | 'config'> {
  json?: boolean
}

export interface CommandResult {
  driver: Driver
  stop?: () => Promise<void>
}

export interface CodegenResult extends CommandResult {
  outdir: string
  files: string[]
}

export interface CssgenResult extends CommandResult {
  outfile: string
  parsed: ParseFileReport[]
  cssBytes: number
  diagnostics: number
}

export interface InspectResult {
  configPath?: string
  sourceCount: number
  watchDirs: string[]
  artifactIds: string[]
  conditionCount: number
  tokenCategoryCount: number
  utilityCount: number
}

interface RunContext {
  driver: Driver
  cwd: string
  outdir: string
  output: OutputSink
}

export async function runCodegen(flags: CodegenFlags = {}, output: OutputSink = consoleOutput): Promise<CodegenResult> {
  const cwd = resolveCwd(flags.cwd)
  const driver = await createNodeDriver({ cwd, configPath: flags.config })
  const outdir = resolveOutdir(cwd, flags.outdir ?? driver.config.outdir)
  const ctx: RunContext = { driver, cwd, outdir, output }
  const files = await codegenOnce(ctx, flags)

  const result: CodegenResult = { driver, outdir, files }
  if (flags.watch) {
    result.stop = await startProjectWatch({
      driver,
      cwd,
      outdir,
      onSourceChange: async (events) => {
        driver.applyChanges(events)
        await codegenOnce(ctx, flags)
      },
      onConfigChange: async () => {
        const diff = await driver.reload()
        if (diff.hasChanged) await codegenOnce(ctx, flags, diff)
      },
    })
  }

  return result
}

export async function runCssgen(flags: CssgenFlags = {}, output: OutputSink = consoleOutput): Promise<CssgenResult> {
  const cwd = resolveCwd(flags.cwd)
  const driver = await createNodeDriver({ cwd, configPath: flags.config })
  const outdir = resolveOutdir(cwd, driver.config.outdir)
  const outfile = resolveFile(cwd, flags.outfile ?? join(outdir, 'styles.css'))

  let current = await cssgenOnce({ driver, cwd, outdir, output }, outfile, flags)
  const result: CssgenResult = { driver, outfile, ...current }

  if (flags.watch) {
    result.stop = await startProjectWatch({
      driver,
      cwd,
      outdir,
      onSourceChange: async (events) => {
        driver.applyChanges(events)
        current = await writeCssgenOutput({ driver, cwd, outdir, output }, outfile, flags, current.parsed)
        Object.assign(result, current)
      },
      onConfigChange: async () => {
        const diff = await driver.reload()
        if (diff.hasChanged) {
          current = await cssgenOnce({ driver, cwd, outdir, output }, outfile, flags)
          Object.assign(result, current)
        }
      },
    })
  }

  return result
}

export async function runInspect(flags: InspectFlags = {}, output: OutputSink = consoleOutput): Promise<InspectResult> {
  const cwd = resolveCwd(flags.cwd)
  const driver = await createNodeDriver({ cwd, configPath: flags.config })
  const result = inspectDriver(driver)

  if (flags.json) {
    output.log(JSON.stringify(result, null, 2))
  } else {
    output.log(
      [
        `config: ${result.configPath ?? '<none>'}`,
        `sources: ${result.sourceCount}`,
        `watch dirs: ${result.watchDirs.length}`,
        `artifacts: ${result.artifactIds.join(', ')}`,
        `conditions: ${result.conditionCount}`,
        `token categories: ${result.tokenCategoryCount}`,
        `utilities: ${result.utilityCount}`,
      ].join('\n'),
    )
  }

  return result
}

export function inspectDriver(driver: Driver): InspectResult {
  const spec = driver.introspect.spec
  const targets = driver.watchTargets()
  return {
    configPath: driver.configPath,
    sourceCount: targets.sources.length,
    watchDirs: targets.dirs,
    artifactIds: driver
      .artifacts()
      .map((artifact) => artifact.id)
      .sort(),
    conditionCount: driver.introspect.conditions().length,
    tokenCategoryCount: Object.keys(spec.tokens.categories).length,
    utilityCount: Object.keys(spec.utilities.properties).length,
  }
}

async function codegenOnce(ctx: RunContext, flags: CodegenFlags, _diff?: ConfigDiff): Promise<string[]> {
  const files = ctx.driver.writeArtifacts(ctx.outdir, ctx.cwd, { specifiers: 'runtime-and-types' })
  if (!flags.silent) {
    ctx.output.log(`codegen: wrote ${files.length} files to ${ctx.outdir}`)
  }
  return files
}

async function cssgenOnce(
  ctx: RunContext,
  outfile: string,
  flags: CssgenFlags,
): Promise<Pick<CssgenResult, 'parsed' | 'cssBytes' | 'diagnostics'>> {
  const parsed = ctx.driver.parseFiles()
  return writeCssgenOutput(ctx, outfile, flags, parsed)
}

export async function writeCssgenOutput(
  ctx: RunContext,
  outfile: string,
  flags: CssgenFlags,
  parsed: ParseFileReport[],
): Promise<Pick<CssgenResult, 'parsed' | 'cssBytes' | 'diagnostics'>> {
  const output = ctx.driver.compile()
  await writeTextFile(outfile, output.css)

  const diagnostics = parsed.reduce((count, report) => count + report.diagnostics.length, output.diagnostics.length)
  if (!flags.silent) {
    ctx.output.log(
      `cssgen: parsed ${parsed.length} files, wrote ${Buffer.byteLength(output.css)} bytes to ${outfile}, ${formatDiagnostics(
        output.diagnostics,
      )}`,
    )
  }

  return {
    parsed,
    cssBytes: Buffer.byteLength(output.css),
    diagnostics,
  }
}

export { normalizeParcelEvent, createEventDebouncer, handleWatchBatch, startProjectWatch } from './watch'
