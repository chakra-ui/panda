import type { SIZES } from './constants'

export type ProseSize = (typeof SIZES)[number]

export type SemanticTokensOptions = {
  /**
   * Whether to ship default prose color tokens.
   * @default true
   */
  enabled?: boolean
  /**
   * Prefix for semantic color tokens (`colors.<prefix>.*`).
   * @default name ("prose")
   */
  prefix?: string
  /**
   * 50–950 color palette used for the defaults.
   * @default 'neutral'
   */
  colorPalette?: string
}

export type TypographyPresetOptions = {
  /**
   * Recipe export, default class name, and default token prefix.
   * @default 'prose'
   */
  name?: string
  /**
   * Override the generated class name when it must differ from `name`.
   */
  className?: string
  /**
   * Size variants to generate.
   * @default ['sm', 'md', 'lg', 'xl', '2xl']
   */
  sizes?: ProseSize[]
  /**
   * Default `size` when omitted at the call site.
   * @default 'md'
   */
  defaultSize?: ProseSize
  /**
   * Opt nested content out of prose styles.
   * `true` uses class `not-prose`; pass a string for a custom class.
   * @default false
   */
  notProse?: boolean | string
  /**
   * Default prose color tokens (`colors.<prefix>.*`).
   * Omit for defaults. Set `{ enabled: false }` to skip (define your own).
   */
  semanticTokens?: SemanticTokensOptions
}
