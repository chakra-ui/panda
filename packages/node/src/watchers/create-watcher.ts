import { logger } from '@css-panda/logger'
import chokidar from 'chokidar'

type WatcherOptions = {
  ignore?: string[]
  cwd?: string
}

export function createWatcher(files: string[], options: WatcherOptions = {}) {
  const { ignore, cwd = process.cwd() } = options

  const watcher = chokidar.watch(files, {
    cwd: cwd,
    ignoreInitial: true,
    ignored: ignore,
  })

  logger.debug({
    type: 'file:watcher',
    msg: `watching glob: [${files}]`,
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
