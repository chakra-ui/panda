import type { StyleDecoder, Stylesheet } from '@pandacss/core'
import type { ArtifactId, ConfigResultWithHooks, CssArtifactType } from '@pandacss/types'
import { match } from 'ts-pattern'
import { generateArtifacts } from './artifacts'
import { generateGlobalCss } from './artifacts/css/global-css'
import { generateKeyframeCss } from './artifacts/css/keyframe-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { generateResetCss } from './artifacts/css/reset-css'
import { generateStaticCss } from './artifacts/css/static-css'
import { generateTokenCss } from './artifacts/css/token-css'
import { Context } from './engines'
import { getMessages } from './messages'
import { getParserOptions, type ParserOptions } from './parser-options'

export class Generator extends Context {
  messages: ReturnType<typeof getMessages>
  parserOptions: ParserOptions

  constructor(conf: ConfigResultWithHooks) {
    super(conf)
    this.parserOptions = getParserOptions(this)
    this.messages = getMessages(this)
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

  getParserCss = (decoder: StyleDecoder, filePath?: string) => {
    return generateParserCss(this, decoder, filePath)
  }

  getCss = (stylesheet?: Stylesheet) => {
    const sheet = stylesheet ?? this.createSheet()
    return sheet.toCss({
      optimize: true,
      minify: this.config.minify,
    })
  }
}
