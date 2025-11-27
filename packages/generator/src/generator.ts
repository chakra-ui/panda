import { Context, type StyleDecoder, type Stylesheet } from '@pandacss/core'
import { dashCase, PandaError } from '@pandacss/shared'
import type { ArtifactId, CssArtifactType, LoadConfigResult } from '@pandacss/types'
import { match } from 'ts-pattern'
import { generateArtifacts } from './artifacts'
import { generateGlobalCss } from './artifacts/css/global-css'
import { generateKeyframeCss } from './artifacts/css/keyframe-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { generateResetCss } from './artifacts/css/reset-css'
import { generateStaticCss } from './artifacts/css/static-css'
import { generateTokenCss } from './artifacts/css/token-css'
import { getThemeCss } from './artifacts/js/themes'

export interface SplitCssArtifact {
  type: 'layer' | 'recipe' | 'theme'
  name: string
  file: string
  code: string
  /** Directory relative to styles/ */
  dir?: string
}

export interface SplitCssResult {
  /** Layer CSS files (reset, global, tokens, utilities) */
  layers: SplitCssArtifact[]
  /** Recipe CSS files */
  recipes: SplitCssArtifact[]
  /** Theme CSS files (not auto-imported) */
  themes: SplitCssArtifact[]
  /** Content for recipes/index.css */
  recipesIndex: string
  /** Content for main styles.css */
  index: string
}

export class Generator extends Context {
  constructor(conf: LoadConfigResult) {
    super(conf)
  }

  getArtifacts = (ids?: ArtifactId[] | undefined) => {
    return generateArtifacts(this, ids)
  }

  appendCssOfType = (type: CssArtifactType, sheet: Stylesheet) => {
    match(type)
      .with('preflight', () => generateResetCss(this, sheet))
      .with('tokens', () => generateTokenCss(this, sheet))
      .with('static', () => generateStaticCss(this, sheet))
      .with('global', () => generateGlobalCss(this, sheet))
      .with('keyframes', () => generateKeyframeCss(this, sheet))
      .otherwise(() => {
        throw new PandaError(
          'UNKNOWN_ARTIFACT',
          `Unknown CSS artifact type: "${type}". Expected one of: preflight, tokens, static, global, keyframes`,
        )
      })
  }

  appendLayerParams = (sheet: Stylesheet) => {
    sheet.layers.root.prepend(sheet.layers.params)
  }

  appendBaselineCss = (sheet: Stylesheet) => {
    if (this.config.preflight) this.appendCssOfType('preflight', sheet)
    if (!this.tokens.isEmpty) this.appendCssOfType('tokens', sheet)
    this.appendCssOfType('static', sheet)
    this.appendCssOfType('global', sheet)
    if (this.config.theme?.keyframes) this.appendCssOfType('keyframes', sheet)
  }

  appendParserCss = (sheet: Stylesheet) => {
    const decoder = this.decoder.collect(this.encoder)
    sheet.processDecoder(decoder)
  }

  getParserCss = (decoder: StyleDecoder) => {
    return generateParserCss(this, decoder)
  }

  getCss = (stylesheet?: Stylesheet) => {
    const sheet = stylesheet ?? this.createSheet()
    let css = sheet.toCss({ minify: this.config.minify })

    if (this.hooks['cssgen:done']) {
      css = this.hooks['cssgen:done']({ artifact: 'styles.css', content: css }) ?? css
    }

    return css
  }

  /**
   * Get CSS for a specific layer from the stylesheet
   */
  getLayerCss = (sheet: Stylesheet, layer: 'reset' | 'base' | 'tokens' | 'recipes' | 'utilities') => {
    return sheet.getLayerCss(layer)
  }

  /**
   * Get CSS for a specific recipe
   */
  getRecipeCss = (recipeName: string) => {
    const sheet = this.createSheet()
    const decoder = this.decoder.collect(this.encoder)
    sheet.processDecoderForRecipe(decoder, recipeName)
    return sheet.getLayerCss('recipes')
  }

  /**
   * Get all recipe names from the decoder
   */
  getRecipeNames = () => {
    const decoder = this.decoder.collect(this.encoder)
    return Array.from(decoder.recipes.keys())
  }

  /**
   * Get all split CSS artifacts for the stylesheet
   * Used when --splitting flag is enabled
   */
  getSplitCssArtifacts = (sheet: Stylesheet): SplitCssResult => {
    const layerNames = this.config.layers as Record<string, string>
    const decoder = this.decoder.collect(this.encoder)

    // Layer artifacts
    const layerDefs = [
      { name: 'reset', file: 'reset.css', css: sheet.getLayerCss('reset') },
      { name: 'global', file: 'global.css', css: sheet.getLayerCss('base') },
      { name: 'tokens', file: 'tokens.css', css: sheet.getLayerCss('tokens') },
      { name: 'utilities', file: 'utilities.css', css: sheet.getLayerCss('utilities') },
    ]

    const layers: SplitCssArtifact[] = layerDefs
      .filter((l) => l.css.trim())
      .map((l) => ({
        type: 'layer' as const,
        name: l.name,
        file: l.file,
        code: l.css,
      }))

    // Recipe artifacts
    const recipes: SplitCssArtifact[] = []
    for (const recipeName of decoder.recipes.keys()) {
      const recipeSheet = this.createSheet()
      recipeSheet.processDecoderForRecipe(decoder, recipeName)
      const code = recipeSheet.getLayerCss('recipes')
      if (code.trim()) {
        recipes.push({
          type: 'recipe',
          name: recipeName,
          file: `${dashCase(recipeName)}.css`,
          code,
          dir: 'recipes',
        })
      }
    }

    // Theme artifacts (not auto-imported in styles.css)
    const themes: SplitCssArtifact[] = []
    if (this.config.themes) {
      for (const themeName of Object.keys(this.config.themes)) {
        const css = getThemeCss(this, themeName)
        if (css.trim()) {
          themes.push({
            type: 'theme',
            name: themeName,
            file: `${dashCase(themeName)}.css`,
            code: `@layer ${layerNames.tokens} {\n${css}\n}`,
            dir: 'themes',
          })
        }
      }
    }

    // Build recipes/index.css content
    const recipesIndex = recipes.map((r) => `@import './${r.file}';`).join('\n')

    // Build main styles.css content
    const layerOrder = [layerNames.reset, layerNames.base, layerNames.tokens, layerNames.recipes, layerNames.utilities]
    const imports = [`@layer ${layerOrder.join(', ')};`, '']

    for (const layer of layers) {
      imports.push(`@import './styles/${layer.file}';`)
    }
    if (recipes.length) {
      imports.push(`@import './styles/recipes/index.css';`)
    }

    return {
      layers,
      recipes,
      themes,
      recipesIndex,
      index: imports.join('\n'),
    }
  }
}
