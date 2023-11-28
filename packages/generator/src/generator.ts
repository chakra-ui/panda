import type { ArtifactId, ConfigResultWithHooks, ParserResultType } from '@pandacss/types'
import { generateArtifacts } from './artifacts'
import { generateFlattenedCss, type FlattenedCssOptions } from './artifacts/css/flat-css'
import { generateGlobalCss } from './artifacts/css/global-css'
import { generateKeyframeCss } from './artifacts/css/keyframe-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { generateResetCss } from './artifacts/css/reset-css'
import { generateStaticCss } from './artifacts/css/static-css'
import { generateTokenCss } from './artifacts/css/token-css'
import { Context } from './engines' // Previously Engine
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

  getArtifacts(ids?: ArtifactId[] | undefined) {
    return generateArtifacts(this, ids)
  }

  getStaticCss() {
    return generateStaticCss(this)
  }

  getResetCss() {
    return generateResetCss(this)
  }

  getTokenCss() {
    return generateTokenCss(this)
  }

  getKeyframeCss() {
    return generateKeyframeCss(this)
  }

  getGlobalCss() {
    return generateGlobalCss(this)
  }

  getCss(options: FlattenedCssOptions) {
    return generateFlattenedCss(this, options)
  }

  getParserCss(result: ParserResultType) {
    return generateParserCss(this, result)
  }
}
