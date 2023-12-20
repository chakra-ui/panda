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

  appendCss(type: CssArtifactType) {
    match(type)
      .with('preflight', () => generateResetCss(this))
      .with('tokens', () => generateTokenCss(this))
      .with('static', () => generateStaticCss(this))
      .with('global', () => generateGlobalCss(this))
      .with('keyframes', () => generateKeyframeCss(this))
      .otherwise(() => {
        throw new Error(`Unknown css artifact type <${type}>`)
      })
  }

  appendLayerParams() {
    this.stylesheet.prepend(this.layers.params)
  }

  appendBaselineCss() {
    if (this.config.preflight) this.appendCss('preflight')
    if (!this.tokens.isEmpty) this.appendCss('tokens')
    if (this.config.staticCss) this.appendCss('static')
    this.appendCss('global')
    if (this.config.theme?.keyframes) this.appendCss('keyframes')
  }

  getParserCss(collector: StyleCollectorType, filePath?: string) {
    return generateParserCss(this, collector, filePath)
  }

  getCss() {
    const collector = this.styleCollector.collect(this.hashFactory)
    this.stylesheet.processStyleCollector(collector)

    return this.stylesheet.toCss({
      optimize: true,
      minify: this.config.minify,
    })
  }
}
