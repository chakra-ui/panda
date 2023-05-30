import { findConfigFile, resolveConfigFile } from '@pandacss/config'
import { ConfigError, ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { createContext, getModuleDependencies } from '@pandacss/node'
import type { Config } from '@pandacss/types'
import createJITI from 'jiti'

const bundle = async (filePath: string, cwd: string) => {
  const jiti = createJITI(cwd, { cache: false, requireCache: false, v8cache: false })
  const conf = jiti(filePath)

  return {
    config: conf,
    path: filePath,
    dependencies: Array.from(getModuleDependencies(filePath)),
  } as BundleConfigResult
}

interface BundleConfigResult {
  config: Config
  path: string
  dependencies: string[]
}

// the rest below is code taken from other workspace packages
// just to replace the `bundle` fn
// so that we can use the `jiti` instead of `bundle-n-require` which use `esbuild`
// which can't be bundled in a vscode extension

// Error: The esbuild JavaScript API cannot be bundled. Please mark the "esbuild" package as external so it's not included in the bundle.
// More information: The file containing the code for esbuild's JavaScript API (/Users/astahmer/.vscode/extensions/chakra-ui.panda-css-vscode-0.0.1/dist/server.js) does not appear to be inside the esbuild package on the file system, which usually means that the esbuild package was bundled into another file. This is problematic because the API needs to run a binary executable inside the esbuild package which is located using a relative path from the API code to the executable. If the esbuild package is bundled, the relative path will be incorrect and the executable won't be found.

type ConfigFileOptions = {
  cwd: string
  file?: string
}

/** @see packages/config/src/load-config.ts */
async function loadConfigFile(options: ConfigFileOptions) {
  const result = await bundleConfigFile(options)
  return resolveConfigFile(result, options.cwd)
}

/** @see packages/config/src/load-config.ts */
async function bundleConfigFile(options: ConfigFileOptions) {
  const { cwd, file } = options
  const filePath = findConfigFile({ cwd, file })

  if (!filePath) {
    throw new ConfigNotFoundError()
  }

  logger.debug('config:path', filePath)

  const result = await bundle(filePath, cwd)

  // TODO: Validate config shape
  if (typeof result.config !== 'object') {
    throw new ConfigError(`💥 Config must export or return an object.`)
  }

  return {
    ...result,
    config: result.config,
    path: filePath,
  }
}

/** @see packages/node/src/config.ts */
export async function loadConfigAndCreateContext(options: { cwd?: string; config?: Config; configPath?: string } = {}) {
  const { cwd = process.cwd(), config, configPath } = options
  const conf = await loadConfigFile({ cwd, file: configPath })

  if (config) {
    Object.assign(conf.config, config)
  }
  if (options.cwd) {
    conf.config.cwd = options.cwd
  }

  return createContext(conf)
}
