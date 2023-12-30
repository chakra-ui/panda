import { dashCase } from '@pandacss/shared'
import type { ArtifactId, Config } from '@pandacss/types'
import microdiff, { type Difference } from 'microdiff'
import { artifactMatchers } from './config-deps'

export interface DiffConfigResult {
  hasConfigChanged: boolean
  artifacts: Set<ArtifactId>
  diffs: Difference[]
}

type ConfigOrFn = Config | (() => Config)
const runIfFn = (fn: ConfigOrFn): Config => (typeof fn === 'function' ? fn() : fn)

/**
 * Diff the two config objects and return the list of affected properties
 */
export function diffConfigs(config: ConfigOrFn, prevConfig: Config | undefined): DiffConfigResult {
  //
  const affected: DiffConfigResult = {
    artifacts: new Set(),
    hasConfigChanged: false,
    diffs: [],
  }

  if (!prevConfig) {
    affected.hasConfigChanged = true
    return affected
  }

  const configDiff = microdiff(prevConfig, runIfFn(config))

  if (!configDiff.length) {
    return affected
  }

  affected.hasConfigChanged = true
  affected.diffs = configDiff

  configDiff.forEach((change) => {
    const changePath = change.path.join('.')

    artifactMatchers.forEach((matcher) => {
      const id = matcher(changePath) as ArtifactId | undefined
      if (!id) return

      // add `recipes.xxx-yyy` to specify which recipes were affected, and later avoid rewriting all recipes
      // same for recipes, use dashCase since those will be used as filenames
      if (id === 'recipes') {
        // ['theme', 'recipes', 'xxx'] => recipes.xxx
        const name = dashCase(change.path.slice(1, 3).join('.') as ArtifactId)
        affected.artifacts.add(name)
      }

      if (id === 'patterns') {
        // ['patterns', 'xxx'] => patterns.xxx
        const name = dashCase(change.path.slice(0, 2).join('.') as ArtifactId)
        affected.artifacts.add(name)
      }

      affected.artifacts.add(id)
    })
  })

  return affected
}
