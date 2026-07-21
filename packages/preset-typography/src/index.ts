import type { Preset } from '@pandacss/types'
import { DEFAULT_COLOR_PALETTE, DEFAULT_RECIPE_NAME } from './constants'
import { createProseRecipe } from './recipe'
import { createSemanticTokens } from './semantic-tokens'
import type { TypographyPresetOptions } from './types'

const definePreset = <T extends Preset>(config: T) => config

function shouldIncludeSemanticTokens(options: TypographyPresetOptions): boolean {
  return options.semanticTokens?.enabled !== false
}

function resolveSemanticPrefix(options: TypographyPresetOptions): string {
  return options.semanticTokens?.prefix ?? options.name ?? DEFAULT_RECIPE_NAME
}

/**
 * Create an opt-in prose typography preset.
 *
 * Adds a `prose` recipe and semantic color tokens for styling Markdown / CMS HTML.
 */
export function createTypographyPreset(options: TypographyPresetOptions = {}): Preset {
  const recipes = createProseRecipe(options)

  return definePreset({
    name: '@pandacss/preset-typography',
    theme: {
      extend: {
        recipes,
        ...(shouldIncludeSemanticTokens(options)
          ? {
              semanticTokens: createSemanticTokens({
                prefix: resolveSemanticPrefix(options),
                colorPalette: options.semanticTokens?.colorPalette ?? DEFAULT_COLOR_PALETTE,
              }),
            }
          : {}),
      },
    },
  })
}

/** Alias for `createTypographyPreset`. */
export { createTypographyPreset as typographyPreset }

/** Default export is the factory — call it in `presets: [typographyPreset()]`. */
export default createTypographyPreset

export { DEFAULT_COLOR_PALETTE, DEFAULT_RECIPE_NAME, SIZES } from './constants'
export type { ProseSize, SemanticTokensOptions, TypographyPresetOptions } from './types'
