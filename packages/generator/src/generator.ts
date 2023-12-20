import type { ArtifactId, ConfigResultWithHooks, StyleCollectorType } from '@pandacss/types'
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
import type { Stylesheet } from '@pandacss/core'

export type CssArtifactType = 'preflight' | 'tokens' | 'static' | 'global' | 'keyframes'

export class Generator extends Context {
  messages: ReturnType<typeof getMessages>
  parserOptions: ParserOptions

  constructor(conf: ConfigResultWithHooks) {
    super(conf)
    this.parserOptions = getParserOptions(this)
    this.messages = getMessages(this)
  }

  getArtifacts(ids?: ArtifactId[] | undefined) {
    return generateArtifacts(this, ids)
  }

  appendCss(type: CssArtifactType, sheet: Stylesheet) {
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

  appendLayerParams(sheet: Stylesheet) {
    sheet.prepend(sheet.layers.params)
  }

  appendBaselineCss(sheet: Stylesheet) {
    if (this.config.preflight) this.appendCss('preflight', sheet)
    if (!this.tokens.isEmpty) this.appendCss('tokens', sheet)
    if (this.config.staticCss) this.appendCss('static', sheet)
    this.appendCss('global', sheet)
    if (this.config.theme?.keyframes) this.appendCss('keyframes', sheet)
  }

  getParserCss(collector: StyleCollectorType, filePath?: string) {
    return generateParserCss(this, collector, filePath)
  }

  getCss(sheet?: Stylesheet) {
    const stylesheet = sheet ?? this.createSheet()
    const collector = this.styleCollector.collect(this.hashFactory)
    stylesheet.processStyleCollector(collector)

    return stylesheet.toCss({
      optimize: true,
      minify: this.config.minify,
    })
  }
}
