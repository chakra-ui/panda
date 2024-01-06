import { logger } from '@pandacss/logger'
import type { Runtime } from '@pandacss/types'
import chokidar from 'chokidar'
import glob from 'fast-glob'
import fsExtra from 'fs-extra'
import { dirname, extname, isAbsolute, join, relative, sep, resolve } from 'pathe'

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
    resolve,
    abs(cwd: string, str: string) {
      return isAbsolute(str) ? str : join(cwd, str)
    },
  },
  fs: {
    existsSync: fsExtra.existsSync,
    readFileSync(filePath: string) {
      return fsExtra.readFileSync(filePath, 'utf8')
    },
    glob(opts) {
      if (!opts.include) return []

      const ignore = opts.exclude ?? []
      if (!ignore.length) {
        ignore.push('**/*.d.ts')
      }

      return glob.sync(opts.include, { cwd: opts.cwd, ignore, absolute: true })
    },
    writeFile: fsExtra.writeFile,
    writeFileSync: fsExtra.writeFileSync,
    readDirSync: fsExtra.readdirSync,
    rmDirSync: fsExtra.emptyDirSync,
    rmFileSync: fsExtra.removeSync,
    ensureDirSync(path: string) {
      return fsExtra.ensureDirSync(path)
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
  logger.error('❌', reason)
})

process.on('uncaughtException', (reason) => {
  logger.error('❌', reason)
})
