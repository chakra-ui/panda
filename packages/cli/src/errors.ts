import { isMainThread, parentPort } from 'worker_threads'
import colors from 'kleur'

export function handleError(error: any) {
  if (error.loc) {
    console.error(colors.bold(colors.red(`Error parsing: ${error.loc.file}:${error.loc.line}:${error.loc.column}`)))
  }
  if (error.frame) {
    console.error(colors.red(error.message))
    console.error(colors.dim(error.frame))
  } else if (error.stack) {
    console.error(colors.red(error.message))
    console.error(colors.dim(error.stack))
  } else {
    console.error(colors.red(error))
  }

  process.exitCode = 1
  if (!isMainThread && parentPort) {
    parentPort.postMessage('error')
  }
}
