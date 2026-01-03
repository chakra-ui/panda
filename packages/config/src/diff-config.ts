import { dashCase } from '@pandacss/shared'
import type { ArtifactId, Config, DiffConfigResult } from '@pandacss/types'
import microdiff from 'microdiff'
import { artifactMatchers } from './config-deps'

type ConfigOrFn = Config | (() => Config)

const runIfFn = (fn: ConfigOrFn): Config => (typeof fn === 'function' ? fn() : fn)

/**
 * Check if recipes were empty before and non-empty now (or vice versa)
 */
const hasRecipeStateTransition = (prevConfig: Config, nextConfig: Config): boolean => {
  const prevRecipes = prevConfig.theme?.recipes ?? {}
  const prevSlotRecipes = prevConfig.theme?.slotRecipes ?? {}
  const prevHasRecipes = Object.keys(prevRecipes).length > 0 || Object.keys(prevSlotRecipes).length > 0

  const nextRecipes = nextConfig.theme?.recipes ?? {}
  const nextSlotRecipes = nextConfig.theme?.slotRecipes ?? {}
  const nextHasRecipes = Object.keys(nextRecipes).length > 0 || Object.keys(nextSlotRecipes).length > 0

  // Return true if there's a transition: empty -> non-empty OR non-empty -> empty
  return prevHasRecipes !== nextHasRecipes
}

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
        const name = dashCase(change.path.slice(1, 3).join('.')) as ArtifactId
        affected.artifacts.add(name)
      }

      if (id === 'patterns') {
        // ['patterns', 'xxx'] => patterns.xxx
        const name = dashCase(change.path.slice(0, 2).join('.')) as ArtifactId
        affected.artifacts.add(name)
      }

      affected.artifacts.add(id)
    })
  })

  // Check if we need to generate/remove create-recipe.mjs due to state transition
  // This handles the case when going from 0 recipes -> 1+ recipes or vice versa
  if (affected.artifacts.has('recipes') || affected.artifacts.has('recipes-index')) {
    const nextConfig = runIfFn(config)
    if (hasRecipeStateTransition(prevConfig, nextConfig)) {
      affected.artifacts.add('create-recipe')
    }
  }

  return affected
}
