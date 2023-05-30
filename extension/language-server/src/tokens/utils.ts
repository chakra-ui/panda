import { box, type NodeRange } from '@pandacss/extractor'
import { Bool } from 'lil-fp'
import { Range } from 'vscode-languageserver'

import { SystemStyleObject } from '@pandacss/types'

import { AtomicRule, optimizeCss } from '@pandacss/core'
import { type PandaContext } from '@pandacss/node'
import { mapObject, toPx } from '@pandacss/shared'
import * as base64 from 'base-64'

import postcss from 'postcss'
import parserCSS from 'prettier/parser-postcss'
import prettier from 'prettier/standalone'
import * as utf8 from 'utf8'

import { Token } from './types'

export const isObjectLike = Bool.or(box.isObject, box.isMap)

export const nodeRangeToVsCodeRange = (range: NodeRange) =>
  Range.create(
    { line: range.startLineNumber - 1, character: range.startColumn - 1 },
    { line: range.endLineNumber - 1, character: range.endColumn - 1 },
  )

const helpers = { map: mapObject }
export const makeSheetCtx = (ctx: PandaContext) => ({
  root: postcss.root(),
  conditions: ctx.conditions,
  utility: ctx.utility,
  hash: ctx.config.hash,
  helpers,
})

function getPrettiedCSS(css: string) {
  return prettier.format(css, {
    parser: 'css',
    plugins: [parserCSS],
  })
}

export const getMarkdownCss = (ctx: PandaContext, styles: SystemStyleObject) => {
  const rule = new AtomicRule(makeSheetCtx(ctx))
  rule.process({ styles })

  const raw = getPrettiedCSS(optimizeCss(rule.toCss(), { minify: false }))
  const withCss = '```css' + '\n' + raw + '\n' + '```'

  return { raw, withCss }
}

export const printTokenValue = (token: Token, withRemToPx?: boolean) =>
  `${token.value}${withRemToPx && token.value.endsWith('rem') ? ` (${toPx(token.value)})` : ''}`

export const svgToMarkdownLink = (svg: string) => {
  const dataUri = 'data:image/svg+xml;charset=UTF-8;base64,' + base64.encode(utf8.encode(svg))
  return `![](${dataUri})`
}
