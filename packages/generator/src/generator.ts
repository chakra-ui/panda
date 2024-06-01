import { Context, type StyleDecoder, type Stylesheet } from '@pandacss/core'
import type { ArtifactId, CssArtifactType, DiffConfigResult, LoadConfigResult } from '@pandacss/types'
import { match } from 'ts-pattern'
import { generateGlobalCss } from './artifacts/css/global-css'
import { generateKeyframeCss } from './artifacts/css/keyframe-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { generateResetCss } from './artifacts/css/reset-css'
import { generateStaticCss } from './artifacts/css/static-css'
import { generateTokenCss } from './artifacts/css/token-css'
import { ArtifactMap } from './artifacts/artifact'
import { getDesignTokensArtifacts, registerStaticArtifacts } from './artifacts/setup-artifacts'

export class Generator extends Context {
  artifacts: ArtifactMap = new ArtifactMap()

  constructor(conf: LoadConfigResult) {
    super(conf)
  }

  /**
   * Generate all the artifacts
   * Can opt-in to filter them if a list of ArtifactId is provided
   */
  getArtifacts = (diffResult?: DiffConfigResult) => {
    const map = registerStaticArtifacts(this.config.emitTokensOnly ? getDesignTokensArtifacts() : this.artifacts)
    const affecteds = map.computeAffectedFiles(this, diffResult)

    return map.generate(this, Array.from(affecteds))
  }

  appendCssOfType = (type: CssArtifactType, sheet: Stylesheet) => {
    match(type)
      .with('preflight', () => generateResetCss(this, sheet))
      .with('tokens', () => generateTokenCss(this, sheet))
      .with('static', () => generateStaticCss(this, sheet))
      .with('global', () => generateGlobalCss(this, sheet))
      .with('keyframes', () => generateKeyframeCss(this, sheet))
      .otherwise(() => {
        throw new Error(`Unknown css artifact type <${type}>`)
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
    let css = sheet.toCss({
      optimize: true,
      minify: this.config.minify,
    })

    if (this.hooks['cssgen:done']) {
      css = this.hooks['cssgen:done']({ artifact: 'styles.css', content: css }) ?? css
    }

    return css
  }
}
