import { z } from 'zod'
import { loadPandaContext } from '../load-config'

// Schema definitions
export const getConfigSchema = z.object({
  section: z
    .enum(['all', 'theme', 'conditions', 'utilities', 'patterns', 'recipes', 'globalCss', 'staticCss'])
    .optional()
    .describe('Specific config property to return from the resolved panda.config file'),
})

// Tool implementation
export async function getConfig(args: z.infer<typeof getConfigSchema>): Promise<any> {
  const ctx = await loadPandaContext()
  const { section = 'all' } = args

  const { config } = ctx.conf

  if (section === 'all') {
    return config
  }

  // Return specific section
  switch (section) {
    case 'theme':
      return config.theme || {}
    case 'conditions':
      return config.conditions || {}
    case 'utilities':
      return config.utilities || {}
    case 'patterns':
      return config.patterns || {}
    case 'recipes':
      return ctx.recipes.config || {}
    case 'globalCss':
      return config.globalCss || {}
    case 'staticCss':
      return config.staticCss || {}
    default:
      return {}
  }
}
