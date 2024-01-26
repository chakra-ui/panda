import { logger } from '@pandacss/logger'
import { traverse } from '@pandacss/shared'
import type { Config, UserConfig } from '@pandacss/types'

/**
 * Validate the config
 * - Check for duplicate between token & semanticTokens names
 * - Check for duplicate between recipes/patterns/slots names
 * - Check for token / semanticTokens paths (must end/contain 'value')
 * - Check for self/circular token references
 * - Check for missing tokens references
 * - Check for conditions selectors (must contain '&')
 * - Check for breakpoints units (must be the same)
 */
export const validateConfig = (config: UserConfig) => {
  const tokenNames = new Set<string>()
  const semanticTokenNames = new Set<string>()

  const validateTokenName = (name: string) => {
    if (semanticTokenNames.has(name)) {
      throw new Error(`This token name is already used in config.theme.semanticToken: ${name}`)
    }

    tokenNames.add(name)
  }

  const validateSemanticTokenName = (name: string) => {
    if (semanticTokenNames.has(name)) {
      throw new Error(`This token name is already used in config.theme.token: ${name}`)
    }

    semanticTokenNames.add(name)
  }

  const recipeNames = new Set<string>()
  const slotRecipeNames = new Set<string>()
  const patternRecipeNames = new Set<string>()

  const validateRecipeName = (name: string) => {
    if (slotRecipeNames.has(name)) {
      throw new Error(`This recipe name is already used in config.theme.slotRecipes: ${name}`)
    }

    if (patternRecipeNames.has(name)) {
      throw new Error(`This recipe name is already used in config.patterns: ${name}`)
    }

    recipeNames.add(name)
  }

  const validateSlotRecipeName = (name: string) => {
    if (recipeNames.has(name)) {
      throw new Error(`This recipe name is already used in config.theme.recipes: ${name}`)
    }

    if (patternRecipeNames.has(name)) {
      throw new Error(`This recipe name is already used in config.patterns: ${name}`)
    }

    slotRecipeNames.add(name)
  }

  const validatePatternRecipeName = (name: string) => {
    if (recipeNames.has(name)) {
      throw new Error(`This recipe name is already used in config.theme.recipes: ${name}`)
    }

    if (slotRecipeNames.has(name)) {
      throw new Error(`This recipe name is already used in config.theme.slotRecipes: ${name}`)
    }

    patternRecipeNames.add(name)
  }

  if (config.theme?.breakpoints) {
    validateBreakpoints(Object.values(config.theme.breakpoints))
  }

  if (config.conditions) {
    Object.values(config.conditions).forEach((condition) => {
      validateCondition(condition)
    })
  }

  if (config.theme?.recipes) {
    Object.keys(config.theme.recipes).forEach((recipeName) => {
      validateRecipeName(recipeName)
    })
  }

  if (config.theme?.slotRecipes) {
    Object.keys(config.theme.slotRecipes).forEach((recipeName) => {
      validateSlotRecipeName(recipeName)
    })
  }

  if (config.patterns) {
    Object.keys(config.patterns).forEach((patternName) => {
      validatePatternRecipeName(patternName)
    })
  }

  const tokens = config.theme?.tokens
  const valueAtPath = new Map<string, any>()
  const refsByPath = new Map<string, Set<string>>()

  if (tokens) {
    const paths = new Set<string>()
    traverse(tokens, (node) => {
      if (node.depth >= 1) {
        validateTokenName(node.path)

        paths.add(node.path)
        valueAtPath.set(node.path, node.value)
      }
    })

    const finalPaths = getFinalPaths(paths)
    finalPaths.forEach((path) => {
      if (!path.includes('value')) {
        throw new Error(`Token paths must end with 'value': ${path}`)
      }

      const atPath = valueAtPath.get(path)
      if (typeof atPath === 'string' && atPath.startsWith('{')) {
        refsByPath.set(path, new Set([]))
      }
    })
  }

  if (config.theme?.semanticTokens) {
    const paths = new Set<string>()

    traverse(config.theme?.semanticTokens, (node) => {
      if (node.depth >= 1) {
        validateSemanticTokenName(node.path)

        paths.add(node.path)
        valueAtPath.set(node.path, node.value)

        // Keep track of all token references
        if (typeof node.value === 'string' && node.value.startsWith('{') && node.path.includes('value')) {
          const tokenPath = node.path.split('.value')[0]
          if (!refsByPath.has(tokenPath)) {
            refsByPath.set(tokenPath, new Set())
          }

          const values = refsByPath.get(tokenPath)!
          const tokenRef = node.value.slice(1, -1)
          values.add(tokenRef)
        }
      }
    })

    const finalPaths = getFinalPaths(paths)
    finalPaths.forEach((path) => {
      if (!path.includes('value')) {
        throw new Error(`Semantic token paths must contain with 'value': ${path}`)
      }
    })

    refsByPath.forEach((refs, path) => {
      if (refs.has(path)) {
        throw new Error(`Self token reference: ${path}`)
      }

      const stack = [path]
      while (stack.length > 0) {
        const current = stack.pop()!
        const value = valueAtPath.get(current)

        if (!value) {
          throw new Error(`Missing token: ${current}`)
        }

        const deps = refsByPath.get(current)
        if (!deps) continue

        deps.forEach((transitiveDep) => {
          if (path === transitiveDep) {
            throw new Error(`Circular token reference: ${transitiveDep} -> ${current} -> ... -> ${path}`)
          }

          stack.push(transitiveDep)
        })
      }
    })
  }
}

const validateCondition = (condition: string) => {
  if (!condition.startsWith('@') && !condition.includes('&')) {
    throw new Error(`Selectors should contain the \`&\` character: ${condition}`)
  }
}

const validateBreakpoints = (breakpoints: string[]) => {
  const units = new Set<string>()
  breakpoints.forEach((bp) => {
    const unit = bp.replace(/[0-9]/g, '')
    units.add(unit)
  })

  if (units.size > 1) {
    throw new Error(`All breakpoints must use the same unit: ${breakpoints.join(', ')}`)
  }
}

const getFinalPaths = (paths: Set<string>) => {
  paths.forEach((path) => {
    paths.forEach((potentialExtension) => {
      if (potentialExtension.startsWith(path + '.')) {
        paths.delete(path)
      }
    })
  })

  return paths
}

/**
 * Check if the config `extends` keyword is used and warn the user if not
 */
export const checkConfig = (config: Config) => {
  if (config.presets?.length === 0) return
  if (config.eject) return

  const warnings = new Set<string>()

  if (config.theme && !config.theme.extend) {
    warnings.add('theme')
  }

  if (config.conditions && !config.conditions.extend) {
    warnings.add('conditions')
  }

  if (config.patterns && !config.patterns.extend) {
    warnings.add('patterns')
  }

  if (warnings.size) {
    logger.warn(
      'config',
      `You are not using the \`extend\` keyword in your ${Array.from(warnings).join(
        ' / ',
      )}. Is this intentional? \n> See: https://panda-css.com/docs/concepts/extend`,
    )
  }
}
