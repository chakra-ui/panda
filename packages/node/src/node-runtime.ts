import { logger } from '@pandacss/logger'
import type { Runtime } from '@pandacss/types'
import chokidar from 'chokidar'
import fsExtra from 'fs-extra'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'path'
import picomatch from 'picomatch'
import { globSync } from 'tinyglobby'
import { globDirname } from './glob-dirname'

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

      return globSync(opts.include, { cwd: opts.cwd, ignore, absolute: true })
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

      const dirnames = globDirname(include)
      const isValidPath = picomatch(include, { cwd, ignore: exclude })
      const workingDir = cwd || process.cwd()

      const watcher = chokidar.watch(dirnames, {
        usePolling: poll,
        cwd,
        ignored(path, stats) {
          const relativePath = relative(workingDir, path)
          return !!stats?.isFile() && !isValidPath(relativePath)
        },
        ignoreInitial: true,
        ignorePermissionErrors: true,
        awaitWriteFinish: coalesce ? { stabilityThreshold: 50, pollInterval: 10 } : false,
      })

      logger.debug('watch:file', `Watching [ ${dirnames.join(', ')} ]`)

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
