import { createContext } from '@pandacss/fixture'
import { type Config } from '@pandacss/types'
import { RuleProcessor } from '../src/rule-processor'

export const createRuleProcessor = (userConfig?: Config) => {
  const ctx = createContext(userConfig)
  return new RuleProcessor(ctx)
}

export function processRecipe(
  recipe: 'buttonStyle' | 'textStyle' | 'tooltipStyle' | 'checkbox',
  value: Record<string, any>,
) {
  return createRuleProcessor().recipe(recipe, value)?.toCss()
}
