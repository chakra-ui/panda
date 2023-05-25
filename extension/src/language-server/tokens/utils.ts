import { box } from '@pandacss/extractor'
import { Bool } from 'lil-fp'
import { Node } from 'ts-morph'
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

export const getNodeRange = (node: Node) => {
  const src = node.getSourceFile()
  const [startPosition, endPosition] = [node.getStart(), node.getEnd()]

  const startInfo = src.getLineAndColumnAtPos(startPosition)
  const endInfo = src.getLineAndColumnAtPos(endPosition)

  return {
    startPosition,
    startLineNumber: startInfo.line,
    startColumn: startInfo.column,
    endPosition,
    endLineNumber: endInfo.line,
    endColumn: endInfo.column,
  }
}

export const nodeRangeToVsCodeRange = (range: ReturnType<typeof getNodeRange>) =>
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

export const printTokenValue = (token: Token) =>
  `🐼 ${token.value}${token.value.includes('rem') ? ` (${toPx(token.value)})` : ''}`

export const svgToMarkdownLink = (svg: string) => {
  const dataUri = 'data:image/svg+xml;charset=UTF-8;base64,' + base64.encode(utf8.encode(svg))
  return `![](${dataUri})`
}
