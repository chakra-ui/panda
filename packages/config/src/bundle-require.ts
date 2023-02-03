import { logger, quote } from '@pandacss/logger'
import type { UserConfig } from '@pandacss/types'
import { realpathSync } from 'fs'
import { relative } from 'path'
import { bundleConfigFile } from './bundle-config'
import { loadBundledFile } from './load-bundled'

export async function bundleAndRequire(filepath: string, cwd: string) {
  const filePath = require.resolve(filepath, { paths: [cwd] })

  let config: UserConfig
  let dependencies: string[]

  const done = logger.time.debug(`Bundling config file ${quote(relative(cwd, filePath))}`)

  try {
    const realFileName = realpathSync(filePath)
    dependencies = [realFileName]

    delete require.cache[filePath]

    const mod = require(realFileName)
    config = mod.default ?? mod
    //
  } catch {
    //
    const bundle = await bundleConfigFile(filePath)
    dependencies = bundle.dependencies

    try {
      config = await loadBundledFile(filePath, bundle.code)
    } catch {
      config = require('node-eval')(bundle.code).default
    }
  }

  done()

  return {
    config,
    dependencies,
  }
}
