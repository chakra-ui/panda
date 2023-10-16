import { createContext } from '@pandacss/fixture'
import { type Config } from '@pandacss/types'
import { RuleProcessor } from '../src/engines/rule-processor'

export const createRuleProcessor = (userConfig?: Config) => {
  const ctx = createContext(userConfig)
  return new RuleProcessor(ctx, { hash: ctx.hashCollector, styles: ctx.stylesCollector })
}

export function processRecipe(recipe: 'buttonStyle' | 'textStyle' | 'tooltipStyle', value: Record<string, any>) {
  return createRuleProcessor().recipe(recipe, value)?.toCss()
}

export const compositions = {
  textStyle: {
    headline: {
      h1: {
        value: {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
      },
      h2: {
        value: {
          fontSize: { base: '1.5rem', lg: '2rem' },
          fontWeight: 'bold',
        },
      },
    },
  },
}
