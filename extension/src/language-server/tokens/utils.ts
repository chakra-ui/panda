import { box } from '@pandacss/extractor'
import { Bool } from 'lil-fp'
import { Node } from 'ts-morph'
import { Range } from 'vscode-languageserver'

import { SystemStyleObject } from '@pandacss/types'

import { AtomicRule, optimizeCss } from '@pandacss/core'
import { type PandaContext } from '@pandacss/node'
import { mapObject, toPx } from '@pandacss/shared'
import * as base64 from 'base-64'
import fs from 'fs'
import postcss from 'postcss'
import parserCSS from 'prettier/parser-postcss'
import prettier from 'prettier/standalone'
import satori from 'satori'
import * as utf8 from 'utf8'

import { Token } from './types'
import path from 'path'

// __dirname = extension/out
const Roboto = fs.readFileSync(path.resolve(__dirname, '../Roboto-Medium.ttf'))

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

export const previewColor = ({ color, width = 256, height = 64 }: { color: string; width: number; height: number }) => {
  const src = `
<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" style="background-color: white;"
  width="${width}px" height="${height}px" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${color}" fill-opacity="${1}" />
      <polygon points="0,0 ${width},0 ${width},${height}" fill="${color}" />
      <rect width="${width}" height="${height}" fill-opacity="0" stroke="gray" strokeWidth="1" />
</svg>`
  const dataUri = 'data:image/svg+xml;charset=UTF-8;base64,' + base64.encode(utf8.encode(src))
  return `![](${dataUri})`
}

// https://og-playground.vercel.app/?share=bZBBT4QwEIX_SjPG7KWJuCqHZvWyMdGzJnvhUugUupaWtEVEwn-3BS9kd04z873My7wJKisQGByE-i4MIT6MGp-nKfWENKjqJjCyu8-y2x1dl2sNSoTmKhHKd5qPkUmNP1vGtarNe8DWR1yhCei2gnPvg5Lj0UZkkvM1Ucmrr9rZ3oij1dZF1Y2UcquR8cKH-kVGHvYX4PT_V55lC5vnwryk5g21tpScrNOiMIe7mErcAwXbBWWNBzbB8jmw_VNOYQ0IWP5IQWDZ18Ak1x4pYGvP6nPsUrhhWKZ4Jpm_tiUKYMH1OFMIvIyKJvkOyRXmPw
export const renderFontSizePreview = (
  text: string,
  fontSize: string,
  options?: {
    width: number
    height: number
  },
) => {
  return satori(
    {
      type: 'div',
      key: null,
      props: {
        children: text,
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          fontSize: fontSize,
        },
      },
    },
    {
      width: 264,
      height: 64,
      ...options,
      fonts: [
        {
          name: 'Roboto',
          data: Roboto,
          weight: 400,
          style: 'normal',
        },
      ],
    },
  )
}

export const svgToMarkdownLink = (svg: string) => {
  const dataUri = 'data:image/svg+xml;charset=UTF-8;base64,' + base64.encode(utf8.encode(svg))
  return `![](${dataUri})`
}
