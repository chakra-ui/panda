import { resolve } from 'node:path'
import { flushTracing, shutdownTracing, startTracing } from '@pandacss/compiler'
import { allowsLogLevel, type OutputSink } from './output'
import type { CommonFlags } from './schema'

const noop = () => undefined

export function startCommandTracing(flags: CommonFlags, cwd: string, output: OutputSink): () => void {
  if (!flags.trace) return noop

  // Native tracing is process-global. A false return means unavailable or already initialized.
  const started = startTracing({
    filter: 'trace',
    output: flags.traceOutput,
    file: flags.traceFile ? resolve(cwd, flags.traceFile) : undefined,
  })

  if (allowsLogLevel(flags, 'debug')) {
    output.log(started ? 'trace: started' : 'trace: unavailable or already active')
  }

  return () => {
    flushTracing()
    shutdownTracing()

    if (allowsLogLevel(flags, 'debug') && started) output.log('trace: stopped')
  }
}
