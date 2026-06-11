import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Diagnostic } from '@pandacss/compiler'
import { countErrors, renderDiagnostics, type DiagnosticFormat } from './diagnostics'
import type { CommonFlags } from './types'

export interface OutputSink {
  log(message: string): void
  error?(message: string): void
}

export const consoleOutput: OutputSink = {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
}

export function resolveCwd(cwd?: string): string {
  return resolve(cwd ?? process.cwd())
}

export function createOutputSink(output: OutputSink, options: { cwd: string; logfile?: string }): OutputSink {
  if (!options.logfile) return output

  const file = resolve(options.cwd, options.logfile)
  mkdirSync(dirname(file), { recursive: true })

  const write = (message: string) => {
    appendFileSync(file, `${message}\n`)
  }

  return {
    log(message) {
      output.log(message)
      write(message)
    },
    error(message) {
      output.error?.(message)
      write(message)
    },
  }
}

export function renderCommandDiagnostics(
  diagnostics: Diagnostic[],
  output: OutputSink,
  flags: CommonFlags,
  cwd: string,
): void {
  if (flags.silent || diagnostics.length === 0) return

  const message = renderDiagnostics(diagnostics, {
    cwd,
    format: commandFormat(flags),
    quiet: flags.quiet,
  })

  if (!message) return

  if (countErrors(diagnostics) > 0) {
    output.error?.(message)
  } else {
    output.log(message)
  }
}

export function shouldPrintJson(flags: Pick<CommonFlags, 'json' | 'format'>): boolean {
  return flags.json === true || flags.format === 'json'
}

export function shouldPrintHumanSummary(flags: CommonFlags): boolean {
  const format = commandFormat(flags)

  return !flags.silent && (format === 'human' || format === 'pretty')
}

export function commandFormat(flags: Pick<CommonFlags, 'json' | 'format'>): DiagnosticFormat {
  if (flags.json) return 'json'
  if (flags.format === 'pretty' || flags.format === 'json' || flags.format === 'github') return flags.format

  return 'human'
}

export function createCommandOutput(output: OutputSink, flags: CommonFlags, cwd: string): OutputSink {
  // JSON output must remain machine-clean; logfile teeing is for human output only.
  return createOutputSink(output, { cwd, logfile: shouldPrintJson(flags) ? undefined : flags.logfile })
}
