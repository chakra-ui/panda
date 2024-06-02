import type { Config, DiffConfigResult } from '@pandacss/types'
import microdiff from 'microdiff'

type ConfigOrFn = Config | (() => Config)

const runIfFn = (fn: ConfigOrFn): Config => (typeof fn === 'function' ? fn() : fn)

/**
 * Diff the two config objects and return the list of affected properties
 */
export function diffConfigs(config: ConfigOrFn, prevConfig: Config | undefined): DiffConfigResult {
  //
  const result: DiffConfigResult = {
    hasConfigChanged: false,
    diffs: [],
  }

  if (!prevConfig) {
    result.hasConfigChanged = true
    return result
  }

  const configDiff = microdiff(prevConfig, runIfFn(config))

  if (!configDiff.length) {
    return result
  }

  result.hasConfigChanged = true
  result.diffs = configDiff

  return result
}
