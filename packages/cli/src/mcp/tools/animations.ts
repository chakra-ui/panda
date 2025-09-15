import { z } from 'zod'
import { loadPandaContext } from '../load-config'

// Schema definitions
export const listKeyframesAndAnimationsSchema = z.object({
  type: z.enum(['keyframes', 'animations', 'all']).optional().describe('Filter by animation type'),
})

// Tool implementations
export async function listBreakpoints(): Promise<any> {
  const ctx = await loadPandaContext()
  return ctx.conditions.breakpoints.keys
}

export async function listKeyframesAndAnimations(
  args: z.infer<typeof listKeyframesAndAnimationsSchema>,
): Promise<{ keyframes: string[]; animations: string[] }> {
  const ctx = await loadPandaContext()
  const { type = 'all' } = args

  const { config } = ctx.conf

  const keyframes = config.theme?.keyframes || {}
  const animations = config?.theme?.tokens?.animations || {}

  const result: { keyframes: string[]; animations: string[] } = { keyframes: [], animations: [] }

  if (type === 'keyframes' || type === 'all') {
    result.keyframes.push(...Object.keys(keyframes))
  }

  if (type === 'animations' || type === 'all') {
    result.animations.push(...Object.keys(animations))
  }

  return result
}
