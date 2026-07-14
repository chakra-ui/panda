import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { flushTracing, shutdownTracing, startTracing, takeTimingsJson } from '@pandacss/compiler'
import { allowsLogLevel, type OutputSink } from './output'
import type { CommonFlags } from './schema'

const noop = () => undefined

/** Where `--profile` writes its bundle when the caller doesn't override it (e.g. `debug --outdir`). */
export interface ProfilePaths {
  trace: string
  timings: string
}

function defaultProfilePaths(cwd: string): ProfilePaths {
  return { trace: resolve(cwd, '.panda/trace.json'), timings: resolve(cwd, '.panda/timings.json') }
}

export function startCommandTracing(
  flags: CommonFlags,
  cwd: string,
  output: OutputSink,
  profilePaths: ProfilePaths = defaultProfilePaths(cwd),
): () => void {
  if (!flags.trace && !flags.profile) return noop

  if (flags.profile && (flags.traceOutput || flags.traceFile) && allowsLogLevel(flags, 'info')) {
    output.log('--profile writes trace.json/timings.json; ignoring --trace-output/--trace-file')
  }

  // Native tracing is process-global. A false return means unavailable or already initialized.
  const started = startTracing({
    // `oxc_resolver` (a dependency, not our code) emits its own trace-level
    // spans for every tsconfig lookup — pure noise in a user-facing trace.
    filter: 'trace,oxc_resolver=off',
    output: flags.profile ? 'profile' : flags.traceOutput,
    file: flags.profile ? profilePaths.trace : flags.traceFile ? resolve(cwd, flags.traceFile) : undefined,
  })

  if (allowsLogLevel(flags, 'debug')) {
    output.log(started ? 'trace: started' : 'trace: unavailable or already active')
  }

  return () => {
    if (flags.profile && started) writeTimingsJson(profilePaths.timings)

    flushTracing()
    shutdownTracing()

    if (allowsLogLevel(flags, 'debug') && started) output.log('trace: stopped')
  }
}

function writeTimingsJson(file: string) {
  const timingsJson = takeTimingsJson()
  if (!timingsJson) return

  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, timingsJson)
}
