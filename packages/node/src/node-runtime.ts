import { logger } from '@pandacss/logger'
import type { Runtime } from '@pandacss/types'
import chokidar from 'chokidar'
import glob from 'fast-glob'
import {
  emptyDirSync,
  ensureDirSync,
  existsSync,
  readdirSync,
  readFileSync,
  removeSync,
  writeFile,
  writeFileSync,
} from 'fs-extra'
import { dirname, extname, isAbsolute, join, relative, sep } from 'path'

export const nodeRuntime: Runtime = {
  cwd() {
    return process.cwd()
  },
  env(name: string) {
    return process.env[name]
  },
  path: {
    join,
    relative,
    dirname,
    extname,
    isAbsolute,
    sep,
    abs(cwd: string, str: string) {
      return isAbsolute(str) ? str : join(cwd, str)
    },
  },
  fs: {
    existsSync,
    readFileSync(filePath: string) {
      return readFileSync(filePath, 'utf8')
    },
    glob(opts) {
      if (!opts.include) return []
      return glob.sync(opts.include, { cwd: opts.cwd, ignore: opts.exclude, absolute: true })
    },
    writeFile,
    writeFileSync,
    readDirSync: readdirSync,
    rmDirSync: emptyDirSync,
    rmFileSync: removeSync,
    ensureDirSync(path: string) {
      return ensureDirSync(path)
    },
    watch(options) {
      const { include, exclude, cwd, poll } = options
      const coalesce = poll || process.platform === 'win32'
      const watcher = chokidar.watch(include, {
        usePolling: poll,
        cwd,
        ignoreInitial: true,
        ignorePermissionErrors: true,
        ignored: exclude,
        awaitWriteFinish: coalesce ? { stabilityThreshold: 50, pollInterval: 10 } : false,
      })

      logger.debug('watch:file', `watching [${include}]`)

      process.once('SIGINT', async () => {
        await watcher.close()
      })

      return watcher
    },
  },
}

process.setMaxListeners(Infinity)

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled-rejection', reason)
})

process.on('uncaughtException', (reason) => {
  logger.error('uncaught-exception', reason)
})
