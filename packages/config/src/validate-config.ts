import { logger } from '@pandacss/logger'
import { PandaError } from '@pandacss/shared'
import type { UserConfig } from '@pandacss/types'
import type { ArtifactNames, TokensData } from './types'
import { validateArtifactNames } from './validation/validate-artifact'
import { validateBreakpoints } from './validation/validate-breakpoints'
import { validateConditions } from './validation/validate-condition'
import { validatePatterns } from './validation/validate-patterns'
import { validateRecipes } from './validation/validate-recipes'
import { validateTokens } from './validation/validate-tokens'

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

  const warnings = new Set<string>()

  const addError = (scope: string, message: string) => {
    warnings.add(`[${scope}] ` + message)
  }

  validateBreakpoints(config.theme?.breakpoints, addError)

  validateConditions(config.conditions, addError)

  const artifacts: ArtifactNames = {
    recipes: new Set(),
    slotRecipes: new Set(),
    patterns: new Set(),
  }

  const tokens: TokensData = {
    tokenNames: new Set(),
    semanticTokenNames: new Set(),
    valueAtPath: new Map(),
    refsByPath: new Map(),
    typeByPath: new Map(),
  }

  if (config.theme) {
    validateTokens({ config, tokens, addError })
    validateRecipes({ config, tokens, artifacts, addError })
  }

  validatePatterns(config.patterns, artifacts)

  validateArtifactNames(artifacts, addError)

  if (warnings.size) {
    const errors = `⚠️ Invalid config:\n${Array.from(warnings)
      .map((err) => '- ' + err)
      .join('\n')}\n`

    if (config.validation === 'error') {
      throw new PandaError('CONFIG_ERROR', errors)
    }

    logger.warn('config', errors)

    return warnings
  }
}
