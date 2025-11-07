import type { AnimationStyles, LayerStyles, TextStyles } from './composition'
import type { RecipeConfig, SlotRecipeConfig } from './recipe'
import type { CssKeyframes } from './system-types'
import type { SemanticTokens, Tokens } from './tokens'

export interface ColorPaletteOptions {
  /**
   * Whether to enable color palette generation.
   * @default true
   */
  enabled?: boolean
  /**
   * List of color names to include in color palette generation.
   * When specified, only these colors will be used for color palettes.
   */
  include?: string[]
  /**
   * List of color names to exclude from color palette generation.
   * When specified, these colors will not be used for color palettes.
   */
  exclude?: string[]
}

export interface Theme {
  /**
   * The breakpoints for your project.
   */
  breakpoints?: Record<string, string>
  /**
   * The css animation keyframes definitions.
   */
  keyframes?: CssKeyframes
  /**
   * The design tokens for your project.
   */
  tokens?: Tokens
  /**
   * The semantic design tokens for your project.
   */
  semanticTokens?: SemanticTokens
  /**
   * The typography styles for your project.
   */
  textStyles?: TextStyles
  /**
   * The layer styles for your project.
   */
  layerStyles?: LayerStyles
  /**
   * The animation styles for your project.
   */
  animationStyles?: AnimationStyles
  /**
   * Multi-variant style definitions for your project.
   * Useful for defining component styles.
   */
  recipes?: Record<string, RecipeConfig>
  /**
   * Multi-variant style definitions for component slots.
   */
  slotRecipes?: Record<string, SlotRecipeConfig>
  /**
   * The predefined container names for your project.
   */
  containerNames?: string[]
  /**
   * The predefined container sizes for your project.
   */
  containerSizes?: Record<string, string>
  /**
   * The color palette configuration for your project.
   */
  colorPalette?: ColorPaletteOptions
}

interface PartialTheme extends Omit<Theme, 'recipes' | 'slotRecipes'> {
  /**
   * Multi-variant style definitions for your project.
   * Useful for defining component styles.
   */
  recipes?: Record<string, Partial<RecipeConfig>>
  /**
   * Multi-variant style definitions for component slots.
   */
  slotRecipes?: Record<string, Partial<SlotRecipeConfig>>
  /**
   * The color palette configuration for your project.
   */
  colorPalette?: Partial<ColorPaletteOptions>
}

export interface ExtendableTheme extends Theme {
  extend?: PartialTheme | undefined
}
