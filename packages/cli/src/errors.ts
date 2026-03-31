import { isMainThread, parentPort } from 'worker_threads'
import colors from 'kleur'
import { PandaError } from '@pandacss/shared'

export function handleError(error: unknown) {
  if (error instanceof PandaError) {
    console.error(colors.red(`${error.code}: ${error.message}`))
    if (error.hint) {
      console.error(colors.dim(error.hint))
    }
    if (error.cause instanceof Error) {
      console.error(colors.dim(`Caused by: ${error.cause.message}`))
    }
  } else if (isLocError(error)) {
    console.error(colors.bold(colors.red(`Error parsing: ${error.loc.file}:${error.loc.line}:${error.loc.column}`)))
    if (error.frame) {
      console.error(colors.red(error.message))
      console.error(colors.dim(error.frame))
    } else {
      console.error(colors.red(error.message))
    }
  } else {
    const message = error instanceof Error ? error.message : String(error)
    console.error(colors.red(message))
  }

  process.exitCode = 1
  if (!isMainThread && parentPort) {
    parentPort.postMessage('error')
  }
}

interface LocError {
  loc: { file: string; line: number; column: number }
  frame?: string
  message: string
}

function isLocError(error: unknown): error is LocError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'loc' in error &&
    typeof (error as any).loc === 'object' &&
    'message' in error
  )
}
