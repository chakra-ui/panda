import type { Diagnostic } from '@pandacss/compiler'

export enum ExitCode {
  Success = 0,
  Failed = 1,
  UsageError = 2,
  InternalError = 3,
}

export interface CliResult {
  ok: boolean
  command: string
  exitCode: ExitCode
  durationMs: number
  timings?: Record<string, number>
  diagnostics: Diagnostic[]
}

export interface CreateResultOptions<T extends object> {
  command: string
  /** `performance.now()` captured when the command started, for `durationMs`. */
  startedAt: number
  /** Command-specific payload merged into the result. */
  data: T
  diagnostics?: Diagnostic[]
  /** Override success; defaults to "no error-severity diagnostics". */
  ok?: boolean
}

export function createResult<T extends object>({
  command,
  startedAt,
  data,
  diagnostics = [],
  ok = diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
}: CreateResultOptions<T>): T & CliResult {
  return {
    ...data,
    ok,
    command,
    exitCode: ok ? ExitCode.Success : ExitCode.Failed,
    durationMs: Math.round(performance.now() - startedAt),
    diagnostics,
  }
}

export function toJsonPayload<T extends CliResult>(result: T) {
  const {
    driver: _driver,
    stop: _stop,
    ...payload
  } = result as T & {
    driver?: unknown
    stop?: unknown
  }
  return payload
}

export function setExitCode<T extends CliResult>(result: T): T {
  process.exitCode = result.exitCode

  return result
}
