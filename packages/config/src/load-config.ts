import { bundleConfig } from './bundle-config'
import { resolveConfig } from './resolve-config'
import type { ConfigFileOptions } from './types'

/**
 * Find, load and resolve the final config (including presets)
 */
export async function loadConfig(options: ConfigFileOptions) {
  const result = await bundleConfig(options)
  return resolveConfig(result, options.cwd)
}
