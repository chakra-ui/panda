import { logger } from '@css-panda/logger'
import chokidar, { WatchOptions } from 'chokidar'
import glob from 'fast-glob'

const getWatchOptions = (): WatchOptions => {
  return {
    atomic: true,
    ignoreInitial: true,
    disableGlobbing: true,
  }
}

type WatcherOptions = {
  ignore?: string[]
  cwd?: string
}

export function createWatcher(files: string[], options: WatcherOptions = {}) {
  const { ignore, cwd = process.cwd() } = options

  const globFiles = glob.sync(files, { cwd, ignore })
  const watcher = chokidar.watch(globFiles, getWatchOptions())

  logger.debug({
    type: 'file:watcher',
    msg: `watching ${globFiles.length} files  /  glob: [${files}]`,
  })

  process.once('SIGINT', async () => {
    await watcher.close()
  })

  process.stdin.on('end', () => {
    process.exit(0)
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
