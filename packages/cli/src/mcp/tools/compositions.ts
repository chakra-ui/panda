import { z } from 'zod'
import { loadPandaContext } from '../load-config'
import { flatten } from '@pandacss/shared'

// Schema definitions
export const listCompositionStylesSchema = z.object({
  type: z
    .enum(['all', 'textStyles', 'layerStyles', 'animationStyles'])
    .optional()
    .describe('Filter by style composition type'),
})

export const listTextStyleSchema = z.object({
  search: z.string().optional().describe('Search text style names'),
})

export const listLayerStyleSchema = z.object({
  search: z.string().optional().describe('Search layer style names'),
})

export const compositionsSchema = z.object({
  type: z.enum(['textStyles', 'layerStyles', 'all']).optional().describe('Filter by composition type'),
})

// Tool implementations
export async function listCompositionStyles(args: z.infer<typeof listCompositionStylesSchema>): Promise<string[]> {
  const ctx = await loadPandaContext()
  const { type = 'all' } = args

  const result: string[] = []

  const textStyles = ctx.config.theme?.textStyles || {}
  const layerStyles = ctx.config.theme?.layerStyles || {}
  const animationStyles = ctx.config.theme?.animationStyles || {}

  if (type === 'textStyles' || type === 'all') {
    // Use flatten like the core system does to get proper composition keys
    const flatTextStyles = flatten(textStyles)
    result.push(...Object.keys(flatTextStyles))
  }

  if (type === 'layerStyles' || type === 'all') {
    // Use flatten like the core system does to get proper composition keys
    const flatLayerStyles = flatten(layerStyles)
    result.push(...Object.keys(flatLayerStyles))
  }

  if (type === 'animationStyles' || type === 'all') {
    // Use flatten like the core system does to get proper composition keys
    const flatAnimationStyles = flatten(animationStyles)
    result.push(...Object.keys(flatAnimationStyles))
  }

  return result.sort()
}

export async function listTextStyles(args: z.infer<typeof listTextStyleSchema>): Promise<any> {
  const ctx = await loadPandaContext()
  const { search } = args

  const textStyles = ctx.config.theme?.textStyles || {}
  const flatTextStyles = flatten(textStyles)
  const styles = []

  for (const [name, style] of Object.entries(flatTextStyles)) {
    // Apply search filter
    if (search && !name.toLowerCase().includes(search.toLowerCase())) continue

    styles.push({
      name,
      style,
      properties: typeof style === 'object' && style ? Object.keys(style) : [],
      description: (style as any)?.description,
      usage: `textStyle="${name}"`,
      cssProperties: getCssProperties(style),
    })
  }

  return {
    textStyles: styles,
    count: styles.length,
    totalTextStyles: Object.keys(flatTextStyles).length,
    description: 'Text styles are reusable typography compositions that help reduce CSS duplication',
  }
}

export async function listLayerStyles(args: z.infer<typeof listLayerStyleSchema>): Promise<any> {
  const ctx = await loadPandaContext()
  const { search } = args

  const layerStyles = ctx.config.theme?.layerStyles || {}
  const flatLayerStyles = flatten(layerStyles)
  const styles = []

  for (const [name, style] of Object.entries(flatLayerStyles)) {
    // Apply search filter
    if (search && !name.toLowerCase().includes(search.toLowerCase())) continue

    styles.push({
      name,
      style,
      properties: typeof style === 'object' && style ? Object.keys(style) : [],
      description: (style as any)?.description,
      usage: `layerStyle="${name}"`,
      cssProperties: getCssProperties(style),
    })
  }

  return {
    layerStyles: styles,
    count: styles.length,
    totalLayerStyles: Object.keys(flatLayerStyles).length,
    description: 'Layer styles are reusable style compositions for common visual patterns',
  }
}

export async function getCompositions(args: z.infer<typeof compositionsSchema>): Promise<any> {
  const ctx = await loadPandaContext()
  const { type = 'all' } = args

  const textStyles = ctx.config.theme?.textStyles || {}
  const layerStyles = ctx.config.theme?.layerStyles || {}
  const animationStyles = ctx.config.theme?.animationStyles || {}

  // Use flatten like the core system does
  const flatTextStyles = flatten(textStyles)
  const flatLayerStyles = flatten(layerStyles)
  const flatAnimationStyles = flatten(animationStyles)

  const result: any = {
    summary: {
      textStyles: Object.keys(flatTextStyles).length,
      layerStyles: Object.keys(flatLayerStyles).length,
      animationStyles: Object.keys(flatAnimationStyles).length,
      total:
        Object.keys(flatTextStyles).length +
        Object.keys(flatLayerStyles).length +
        Object.keys(flatAnimationStyles).length,
    },
    description: 'Style compositions are reusable style properties that help reduce the lines of CSS you write',
  }

  if (type === 'textStyles' || type === 'all') {
    result.textStyles = Object.entries(flatTextStyles).map(([name, style]) => ({
      name,
      type: 'textStyle',
      style,
      properties: typeof style === 'object' && style ? Object.keys(style) : [],
      cssProperties: getCssProperties(style),
      usage: `textStyle="${name}"`,
      description: 'Typography composition for consistent text styling',
    }))
  }

  if (type === 'layerStyles' || type === 'all') {
    result.layerStyles = Object.entries(flatLayerStyles).map(([name, style]) => ({
      name,
      type: 'layerStyle',
      style,
      properties: typeof style === 'object' && style ? Object.keys(style) : [],
      cssProperties: getCssProperties(style),
      usage: `layerStyle="${name}"`,
      description: 'Visual composition for common layout patterns',
    }))
  }

  if (type === 'all') {
    result.animationStyles = Object.entries(flatAnimationStyles).map(([name, style]) => ({
      name,
      type: 'animationStyle',
      style,
      properties: typeof style === 'object' && style ? Object.keys(style) : [],
      cssProperties: getCssProperties(style),
      usage: `animationStyle="${name}"`,
      description: 'Animation composition for consistent motion patterns',
    }))
  }

  return result
}

// Helper function to extract CSS properties
function getCssProperties(style: any): string[] {
  if (!style || typeof style !== 'object') return []

  const cssProps = []

  for (const [key, value] of Object.entries(style)) {
    if (typeof value === 'string' || typeof value === 'number') {
      cssProps.push(key)
    } else if (typeof value === 'object' && value !== null) {
      // Handle responsive or conditional values
      cssProps.push(key)
    }
  }

  return cssProps
}
