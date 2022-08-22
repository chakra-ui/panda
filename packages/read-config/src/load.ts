import { error, createDebugger } from '@css-panda/logger'
import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { pathToFileURL } from 'url'
import { bundleConfigFile } from './bundle'
import { findConfigFile } from './find'
import { loadBundledFile } from './load-bundled'
import { normalizePath } from './normalize-path'

type ConfigType = any

const debug = createDebugger('panda:config')

const dynamicImport = new Function('file', 'return import(file)')
interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any
}
export async function loadConfigFile({ root = process.cwd(), file }: { root?: string; file?: string } = {}) {
  let dependencies: string[] = []

  const { isESM, isTS, resolvedPath } = findConfigFile({ root, file }) ?? {}

  if (!resolvedPath) return {}

  const start = performance.now()
  const getTime = () => `${(performance.now() - start).toFixed(2)}ms`
  const bundled = await bundleConfigFile(resolvedPath, true)
  const fileUrl = pathToFileURL(resolvedPath)
  const fileName = resolvedPath
  let config
  let { code } = bundled

  try {
    if (isESM) {
      const fileBase = `${fileName}.timestamp-${Date.now()}`
      const fileNameTmp = `${fileBase}.mjs`
      const fileUrl = `${pathToFileURL(fileBase)}.mjs`
      fs.writeFileSync(fileNameTmp, bundled.code)
      try {
        config = (await dynamicImport(fileUrl)).default
      } finally {
        try {
          fs.unlinkSync(fileNameTmp)
        } catch {
          // already removed if this function is called twice simultaneously
        }
      }
    }
    // for cjs, we can register a custom loader via `_require.extensions`
    else {
      config = loadBundledFile(fileName, bundled.code)
    }

    console.log('config.prefix', config.prefix)
    if (typeof config !== 'object') {
      throw new Error(`💥 config must export or return an object.`)
    }

    dependencies = dependencies.map((dep) => normalizePath(path.resolve(dep)))
    console.log('dependencies', dependencies)
    return {
      path: resolvedPath,
      config,
      dependencies,
      code,
    }
  } catch (e) {
    error(`failed to load config from ${resolvedPath}`, { error: e })
    throw e
  }
}
