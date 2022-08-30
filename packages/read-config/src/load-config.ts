import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { bundleConfigFile } from './bundle-config'
import { findConfigFile } from './find-config'
import { loadBundledFile } from './load-bundled-config'
import { normalizePath } from './normalize-path'

const dynamicImport = new Function('file', 'return import(file)')

export async function loadConfigFile<T extends Record<string, any> = Record<string, any>>({
  root = process.cwd(),
  file,
}: { root?: string; file?: string } = {}) {
  const { isESM, resolvedPath } = findConfigFile({ root, file }) ?? {}

  if (!resolvedPath) return {}

  const bundled = await bundleConfigFile(resolvedPath, true)
  const dependencies = bundled.dependencies ?? []

  const fileName = resolvedPath
  let config: T

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
    config = await loadBundledFile(fileName, bundled.code)
  }

  if (typeof config !== 'object') {
    throw new Error(`💥 config must export or return an object.`)
  }

  return {
    path: resolvedPath,
    config,
    dependencies: dependencies.map((dep) => normalizePath(path.resolve(dep))),
    code: bundled.code,
  }
}

export type LoadConfigResult<T> = {
  path: string
  config: T
  dependencies: string[]
  code: string
}
