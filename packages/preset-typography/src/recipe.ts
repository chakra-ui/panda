import type { RecipeConfig } from '@pandacss/types'
import { DEFAULT_RECIPE_NAME, SIZES } from './constants'
import { createProseBase, createProseSize } from './styles'
import type { ProseSize, TypographyPresetOptions } from './types'

function resolveNotProseClass(notProse: TypographyPresetOptions['notProse']): string | undefined {
  if (!notProse) return undefined
  if (notProse === true) return 'not-prose'
  return notProse
}

function resolveTokenPrefix(options: TypographyPresetOptions): string {
  return options.semanticTokens?.prefix ?? options.name ?? DEFAULT_RECIPE_NAME
}

export function createProseRecipe(options: TypographyPresetOptions = {}): Record<string, RecipeConfig> {
  const name = options.name ?? DEFAULT_RECIPE_NAME
  const className = options.className ?? name
  const prefix = resolveTokenPrefix(options)
  const notProseClass = resolveNotProseClass(options.notProse)

  const sizes = options.sizes ?? [...SIZES]
  if (sizes.length === 0) {
    throw new Error('@pandacss/preset-typography: include at least one size variant')
  }

  const defaultSize = options.defaultSize ?? (sizes.includes('md') ? 'md' : sizes[0])
  if (!sizes.includes(defaultSize)) {
    throw new Error(`@pandacss/preset-typography: defaultSize "${defaultSize}" is not in sizes [${sizes.join(', ')}]`)
  }

  const sizeVariants = Object.fromEntries(
    sizes.map((size: ProseSize) => [size, createProseSize(size, notProseClass)]),
  ) as Record<ProseSize, ReturnType<typeof createProseSize>>

  return {
    [name]: {
      className,
      description: 'Typography styles for Markdown and CMS HTML',
      base: createProseBase(prefix, notProseClass),
      defaultVariants: {
        size: defaultSize,
      },
      variants: {
        size: sizeVariants,
      },
    },
  }
}
