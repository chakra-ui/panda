import { error, createDebugger } from '@css-panda/logger'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { bundleConfigFile } from './bundle'
import { findConfigFile } from './find'
import { loadBundledFile } from './load-bundled'
import { normalizePath } from './normalize-path'

type ConfigType = any

const debug = createDebugger('panda:config')

export async function loadConfigFile({ root = process.cwd(), file }: { root?: string; file?: string } = {}) {
  let dependencies: string[] = []

  const { isESM, isTS, resolvedPath } = findConfigFile({ root, file }) ?? {}

  if (!resolvedPath) return {}

  const start = performance.now()
  const getTime = () => `${(performance.now() - start).toFixed(2)}ms`

  try {
    let config: ConfigType | undefined
    let code: string | undefined

    if (isESM) {
      const fileUrl = pathToFileURL(resolvedPath)
      const bundled = await bundleConfigFile(resolvedPath, true)
      dependencies = bundled.dependencies
      code = bundled.code
      if (isTS) {
        // before we can register loaders without requiring users to run node
        // with --experimental-loader themselves, we have to do a hack here:
        // bundle the config file w/ ts transforms first, write it to disk,
        // load it with native Node ESM, then delete the file.
        fs.writeFileSync(resolvedPath + '.js', bundled.code)
        config = (await import(`${fileUrl}.js?t=${Date.now()}`)).default
        fs.unlinkSync(resolvedPath + '.js')
        debug(`✅ TS + native esm config loaded in ${getTime()}`, fileUrl)
      } else {
        // using Function to avoid this from being compiled away by TS/Rollup
        // append a query so that we force reload fresh config in case of
        // server restart
        config = (await import(`${fileUrl}?t=${Date.now()}`)).default
        debug(`✅ native esm config loaded in ${getTime()}`, fileUrl)
      }
    }

    if (!config) {
      // Bundle config file and transpile it to cjs using esbuild.
      const bundled = await bundleConfigFile(resolvedPath)
      dependencies = bundled.dependencies
      config = await loadBundledFile(resolvedPath, bundled.code)
      debug(`✅ bundled config file loaded in ${getTime()}`)
    }

    if (typeof config !== 'object') {
      throw new Error(`💥 config must export or return an object.`)
    }

    dependencies = dependencies.map((dep) => normalizePath(path.resolve(dep)))

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
