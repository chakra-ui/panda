import { logger } from '@pandacss/logger'
import type { ParserMode } from '@pandacss/parser'
import type { ParserResult } from '@pandacss/types'
import { writeFile } from 'fs/promises'
import { Node } from 'ts-morph'
import { classifyTokens } from './classify'
import type { PandaContext } from './create-context'
import { getNodeRange } from './get-node-range'

import gzipSize from 'gzip-size'
import { filesize } from 'filesize'

export function analyzeTokens(
  ctx: PandaContext,
  onResult?: (file: string, result: ParserResult) => void,
  mode: ParserMode = 'internal',
) {
  const done = logger.time.debug(`Analyzed ${ctx.getFiles().length} files`)

  const parserResultByFilepath = new Map<string, ParserResult>()

  ctx
    .getFiles()
    .map((file) => {
      const measure = logger.time.debug(`Extracted ${file}`)
      const result = ctx.project.parseSourceFile(file, ctx.properties, mode)
      measure()

      if (result) {
        parserResultByFilepath.set(file, result)
        onResult?.(file, result)
      }

      return [file, result] as [string, ParserResult]
    })
    .filter(([, result]) => result)

  done()

  const minify = ctx.config.minify
  const files = ctx.chunks.getFiles()

  ctx.config.minify = false
  const css = ctx.getCss({ files })

  ctx.config.minify = true
  const minifiedCss = ctx.getCss({ files })

  // restore minify config
  ctx.config.minify = minify

  return Object.assign(classifyTokens(ctx, parserResultByFilepath), {
    sizes: {
      normal: filesize(Buffer.byteLength(css, 'utf-8')),
      minified: filesize(Buffer.byteLength(minifiedCss, 'utf-8')),
      gzip: {
        normal: filesize(gzipSize.sync(css)),
        minified: filesize(gzipSize.sync(minifiedCss)),
      },
    },
  })
}

const analyzeResultSerializer = (_key: string, value: any) => {
  if (value instanceof Set) {
    return Array.from(value)
  }

  if (value instanceof Map) {
    return Object.fromEntries(value)
  }

  if (Node.isNode(value)) {
    return { kind: value.getKindName(), range: getNodeRange(value) }
  }

  return value
}

export const writeAnalyzeJSON = (fileName: string, result: ReturnType<typeof analyzeTokens>, ctx: PandaContext) => {
  // prevent writing twice the same BoxNode in the output (already serialized in the `byId` map)
  result.details.byInstanceId.forEach((item) => {
    item.box = { type: item.box.type, node: item.box.getNode(), stack: item.box.getStack() } as any
  })

  return writeFile(
    fileName,
    JSON.stringify(
      Object.assign(result, {
        cwd: ctx.config.cwd,
        theme: ctx.config.theme,
        utilities: ctx.config.utilities,
        conditions: ctx.config.conditions,
        shorthands: ctx.utility.shorthands,
        parserOptions: ctx.parserOptions,
      }),
      analyzeResultSerializer,
      2,
    ),
  )
}
