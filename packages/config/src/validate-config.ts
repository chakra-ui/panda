import { logger } from '@pandacss/logger'
import { traverse } from '@pandacss/shared'
import type { Config, Tokens, UserConfig } from '@pandacss/types'

type AddError = (scope: string, message: string) => void

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
export const validateConfig = (config: Partial<UserConfig>) => {
  if (config.validation === 'none') return

  const errors = new Set<string>()
  const addError = (scope: string, message: string) => {
    if (config.validation === 'warn') {
      errors.add(`[${scope}]: ` + message)
    } else {
      throw new Error(`[${scope}]: ` + message)
    }
  }

  if (config.theme?.breakpoints) {
    validateBreakpoints(Object.values(config.theme.breakpoints), addError)
  }

  if (config.conditions) {
    Object.values(config.conditions).forEach((condition) => {
      validateCondition(condition, addError)
    })
  }

  const artifacts: ArtifactNames = { recipes: new Set(), slotRecipes: new Set(), patterns: new Set() }
  const tokens: TokensData = {
    tokenNames: new Set(),
    semanticTokenNames: new Set(),
    valueAtPath: new Map(),
    refsByPath: new Map(),
  }

  if (config.theme) {
    validateTokens({ config, tokens, addError })
    validateRecipes({ config, tokens, artifacts, addError })
  }

  if (config.patterns) {
    validatePatterns(config.patterns, artifacts)
  }

  validateArtifactNames(artifacts, addError)

  if (errors.size) {
    logger.warn(
      'config',
      `⚠️ Invalid config:\n${Array.from(errors)
        .map((err) => '- ' + err)
        .join('\n')}\n`,
    )
    return errors
  }
}

interface TokensData {
  tokenNames: Set<string>
  semanticTokenNames: Set<string>
  valueAtPath: Map<string, any>
  refsByPath: Map<string, Set<string>>
}

const validateTokens = ({ config, tokens, addError }: { config: Config; tokens: TokensData; addError: AddError }) => {
  const theme = config.theme
  if (!theme) return

  const { tokenNames, semanticTokenNames, valueAtPath, refsByPath } = tokens

  if (theme.tokens) {
    traverse(theme.tokens, (node) => {
      if (node.depth >= 1) {
        tokenNames.add(node.path)
        valueAtPath.set(node.path, node.value)
      }
    })

    const finalPaths = getFinalPaths(tokenNames)
    finalPaths.forEach((path) => {
      if (!path.includes('value')) {
        addError('tokens', `Token paths must end with 'value': \`theme.tokens.${path}\``)
      }

      const atPath = valueAtPath.get(path)
      if (typeof atPath === 'string' && atPath.startsWith('{')) {
        refsByPath.set(path, new Set([]))
      }
    })
  }

  if (theme.semanticTokens) {
    traverse(theme.semanticTokens, (node) => {
      if (node.depth >= 1) {
        semanticTokenNames.add(node.path)
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

    const finalPaths = getFinalPaths(semanticTokenNames)
    finalPaths.forEach((path) => {
      if (!path.includes('value')) {
        addError('tokens', `Semantic token paths must contain 'value': \`theme.semanticTokens.${path}\``)
      }
    })

    validateTokenReferences(valueAtPath, refsByPath, addError)
  }

  semanticTokenNames.forEach((semanticTokenName) => {
    if (tokenNames.has(semanticTokenName)) {
      addError('tokens', `This token name is already used in \`config.theme.token\`: \`${semanticTokenName}\``)
    }
  })
}

const validateTokenReferences = (
  valueAtPath: Map<string, any>,
  refsByPath: Map<string, Set<string>>,
  addError: AddError,
) => {
  refsByPath.forEach((refs, path) => {
    if (refs.has(path)) {
      addError('tokens', `Self token reference: \`${path}\``)
    }

    const stack = [path]
    while (stack.length > 0) {
      const current = stack.pop()!
      const value = valueAtPath.get(current)

      if (!value) {
        addError('tokens', `Missing token: \`${current}\` used in \`config.semanticTokens.${path}\``)
      }

      const deps = refsByPath.get(current)
      if (!deps) continue

      for (const transitiveDep of deps) {
        if (path === transitiveDep) {
          addError('tokens', `Circular token reference: \`${transitiveDep}\` -> \`${current}\` -> ... -> \`${path}\``)
          break
        }

        stack.push(transitiveDep)
      }
    }
  })
}

const validateRecipes = ({
  config,
  artifacts,
}: {
  config: Config
  tokens: TokensData
  artifacts: ArtifactNames
  addError: AddError
}) => {
  const theme = config.theme
  if (!theme) return

  if (theme.recipes) {
    Object.keys(theme.recipes).forEach((recipeName) => {
      artifacts.recipes.add(recipeName)
    })
  }

  if (theme.slotRecipes) {
    Object.keys(theme.slotRecipes).forEach((recipeName) => {
      artifacts.slotRecipes.add(recipeName)
    })
  }

  return artifacts
}

const validatePatterns = (patterns: Tokens, names: ArtifactNames) => {
  Object.keys(patterns).forEach((patternName) => {
    names.patterns.add(patternName)
  })
}

interface ArtifactNames {
  recipes: Set<string>
  slotRecipes: Set<string>
  patterns: Set<string>
}

const validateArtifactNames = (names: ArtifactNames, addError: AddError) => {
  names.recipes.forEach((recipeName) => {
    if (names.slotRecipes.has(recipeName)) {
      addError('recipes', `This recipe name is already used in \`config.theme.slotRecipes\`: ${recipeName}`)
    }

    if (names.patterns.has(recipeName)) {
      addError('recipes', `This recipe name is already used in \`config.patterns\`: \`${recipeName}\``)
    }
  })

  names.slotRecipes.forEach((recipeName) => {
    if (names.patterns.has(recipeName)) {
      addError('recipes', `This recipe name is already used in \`config.patterns\`: ${recipeName}`)
    }
  })
}

const validateCondition = (condition: string, addError: AddError) => {
  if (!condition.startsWith('@') && !condition.includes('&')) {
    addError('conditions', `Selectors should contain the \`&\` character: \`${condition}\``)
  }
}

const validateBreakpoints = (breakpoints: string[], addError: AddError) => {
  const units = new Set<string>()
  breakpoints.forEach((bp) => {
    const unit = bp.replace(/[0-9]/g, '')
    units.add(unit)
  })

  if (units.size > 1) {
    addError('breakpoints', `All breakpoints must use the same unit: \`${breakpoints.join(', ')}\``)
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
  if (config.validation === 'none') return

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

    return warnings
  }
}
