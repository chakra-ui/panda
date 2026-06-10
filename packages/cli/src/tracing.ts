import { resolve } from 'node:path'
import { flushTracing, shutdownTracing, startTracing } from '@pandacss/compiler'
import type { OutputSink } from './output'
import type { CommonFlags } from './types'

const noop = () => undefined

export function startCommandTracing(flags: CommonFlags, cwd: string, output: OutputSink): () => void {
  if (!flags.trace) return noop

  // Native tracing is process-global. A false return means unavailable or already initialized.
  const started = startTracing({
    filter: 'trace',
    output: flags.traceOutput,
    file: flags.traceFile ? resolve(cwd, flags.traceFile) : undefined,
  })

  if (flags.verbose) {
    output.log(started ? 'trace: started' : 'trace: unavailable or already active')
  }

  return () => {
    flushTracing()
    shutdownTracing()

    if (flags.verbose && started) output.log('trace: stopped')
  }
}
