import { minifyConfig } from '@css-panda/ast'
import { logger } from '@css-panda/logger'
import type { UserConfig } from '@css-panda/types'
import fs from 'fs'
import { pathToFileURL } from 'url'
import { bundleConfigFile } from './bundle-config'
import { findConfigFile } from './find-config'
import { loadBundledFile } from './load-bundled-config'

const dynamicImport = new Function('file', 'return import(file)')

type ConfigFileOptions = {
  cwd: string
  file?: string
}

export async function loadConfigFile(options: ConfigFileOptions) {
  const { cwd, file } = options

  const { isESM, filepath } = findConfigFile({ cwd, file }) ?? {}

  logger.debug({ type: 'config', msg: `Found config file at: \n${filepath}` })

  if (!filepath) return {}

  const bundled = await bundleConfigFile(filepath, isESM)

  logger.debug({ type: 'config', msg: 'Bundled Config File' })

  const dependencies = bundled.dependencies ?? []

  const fileName = filepath
  let config: UserConfig

  if (isESM) {
    const fileBase = `${fileName}.timestamp-${Date.now()}`
    const fileNameTmp = `${fileBase}.mjs`

    fs.writeFileSync(fileNameTmp, bundled.code)

    try {
      const fileUrl = `${pathToFileURL(fileBase)}.mjs`
      config = (await dynamicImport(fileUrl)).default
    } finally {
      try {
        fs.unlinkSync(fileNameTmp)
      } catch {
        // already removed if this function is called twice simultaneously
      }
    }
  } else {
    config = await loadBundledFile(fileName, bundled.code)
  }

  if (typeof config !== 'object') {
    throw new Error(`💥 config must export or return an object.`)
  }

  return {
    path: filepath,
    config,
    dependencies,
    code: bundled.code,
    minifiedCode: minifyConfig(bundled.code),
  }
}

export type LoadConfigResult = {
  path: string
  config: UserConfig
  dependencies: string[]
  code: string
  minifiedCode: string
}
