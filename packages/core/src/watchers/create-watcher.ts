import { logger } from '@css-panda/logger'
import { filespy } from 'filespy'

type WatcherOptions = {
  ignore?: string[]
  cwd?: string
}

export function createWatcher(files: string[], options: WatcherOptions = {}) {
  const { ignore, cwd = process.cwd() } = options

  logger.debug({ type: 'file:watcher', cwd, files })

  const watcher = filespy(cwd, {
    only: files,
    skip: ignore,
  })

  process.once('SIGINT', async () => {
    await watcher.close()
  })

  return watcher
}

export function onProcessExceptions() {
  process.on('unhandledRejection', (reason) => {
    logger.error(reason)
  })
  process.on('uncaughtException', (err) => {
    logger.error(err)
  })
}
