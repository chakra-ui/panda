import { createNodeDriver, type Diagnostic, type Driver } from '@pandacss/compiler'
import { configLoadDiagnostic, diagnosticsPass, missingConfigDiagnostic, normalizeDiagnostics } from './diagnostics'
import {
  consoleOutput,
  createCommandOutput,
  renderCommandDiagnostics,
  resolveCwd,
  shouldPrintJson,
  type OutputSink,
} from './output'
import { createResult, toJsonPayload, type CliResult } from './result'
import { renderTimings, timeAsync } from './timing'
import { startCommandTracing } from './tracing'
import type { CommonFlags, PhaseTimings } from './schema'

export interface CommandRunContext<TFlags extends CommonFlags = CommonFlags> {
  command: string
  flags: TFlags
  cwd: string
  /** Tee'd sink (logfile when enabled). */
  output: OutputSink
  /** Raw sink passed into runX — used for JSON (machine-clean). */
  rawOutput: OutputSink
  timings: PhaseTimings
  driver: Driver
}

export interface CommandExecuteResult<TData extends object> {
  data: TData
  diagnostics?: Diagnostic[]
  ok?: boolean
}

export interface RunCommandOptions<TFlags extends CommonFlags, TData extends object> {
  command: string
  flags: TFlags
  output?: OutputSink
  /** Payload merged into bootstrap failures (timings added by the runner). */
  failData: (diagnostics: Diagnostic[]) => Partial<TData>
  execute(ctx: CommandRunContext<TFlags>): Promise<CommandExecuteResult<TData>>
  /** Human-mode output after bootstrap failures and successful runs (not JSON). */
  renderHuman?(ctx: Omit<CommandRunContext<TFlags>, 'driver'> & { driver?: Driver }, result: CliResult & TData): void
  /** Keep tracing open until `result.stop()` (watch mode). */
  keepTracing?: boolean
}

export async function runCommand<TFlags extends CommonFlags, TData extends object>(
  options: RunCommandOptions<TFlags, TData>,
): Promise<CliResult & TData & { driver?: Driver; stop?: () => Promise<void> }> {
  const {
    command,
    flags,
    output: rawOutput = consoleOutput,
    failData,
    execute,
    renderHuman,
    keepTracing = false,
  } = options

  type Result = CliResult & TData & { driver?: Driver; stop?: () => Promise<void> }

  const startedAt = performance.now()
  const cwd = resolveCwd(flags.cwd)
  const commandOutput = createCommandOutput(rawOutput, flags, cwd)
  const timings: PhaseTimings = {}
  const stopTracing = startCommandTracing(flags, cwd, commandOutput)

  const emit = (result: Result) => {
    if (shouldPrintJson(flags)) {
      rawOutput.log(JSON.stringify(toJsonPayload(result), null, 2))
      return
    }

    const ctx: Omit<CommandRunContext<TFlags>, 'driver'> & { driver?: Driver } = {
      command,
      flags,
      cwd,
      output: commandOutput,
      rawOutput,
      timings,
      driver: result.driver,
    }

    if (renderHuman) {
      renderHuman(ctx, result)
    } else {
      renderDefaultHuman(ctx, result)
    }

    renderTimings({ command, timings, output: commandOutput, flags })
  }

  const finish = (data: Partial<TData> | TData, diagnostics: Diagnostic[], ok: boolean, driver?: Driver): Result => {
    const result = createResult({
      command,
      startedAt,
      data: { ...data, timings },
      diagnostics,
      ok,
    }) as Result

    if (driver) result.driver = driver

    emit(result)

    if (!keepTracing) stopTracing()

    return result
  }

  const missingConfig = missingConfigDiagnostic(flags.config, cwd)
  if (missingConfig) {
    return finish(failData([missingConfig]), [missingConfig], false)
  }

  let driver: Driver
  try {
    driver = await timeAsync({
      timings,
      phase: 'config',
      run: () => createNodeDriver({ cwd, configPath: flags.config }),
    })
  } catch (error) {
    const diagnostics = [configLoadDiagnostic(error, { cwd, file: flags.config })]
    return finish(failData(diagnostics), diagnostics, false)
  }

  const ctx: CommandRunContext<TFlags> = {
    command,
    flags,
    cwd,
    output: commandOutput,
    rawOutput,
    timings,
    driver,
  }

  const { data, diagnostics = normalizeDiagnostics(driver.compiler.diagnostics(), { cwd }), ok } = await execute(ctx)
  const passed = ok ?? diagnosticsPass(diagnostics, flags.maxWarnings)
  const result = finish(data, diagnostics, passed, driver)

  if (keepTracing) {
    result.stop = async () => {
      stopTracing()
    }
  }

  return result
}

function renderDefaultHuman<TData extends object>(
  ctx: Omit<CommandRunContext, 'driver'> & { driver?: Driver },
  result: CliResult & TData,
): void {
  if (result.diagnostics.length > 0) {
    renderCommandDiagnostics(result.diagnostics, ctx.output, ctx.flags, ctx.cwd)
  }
}
