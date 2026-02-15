import MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { ParserResultInterface } from '@pandacss/types'
import { inlineCssCall } from './css'
import { inlinePatternCall } from './pattern'

export function inlineFile(
  code: string,
  filePath: string,
  parserResult: ParserResultInterface,
  ctx: PandaContext,
): { code: string; map: any } | undefined {
  const ms = new MagicString(code)
  let changed = false

  // Inline css() calls
  for (const item of parserResult.css) {
    if (inlineCssCall(ms, item, ctx)) changed = true
  }

  // Inline pattern calls (hstack, vstack, grid, etc.)
  for (const [name, items] of parserResult.pattern) {
    for (const item of items) {
      if (inlinePatternCall(ms, item, name, ctx)) changed = true
    }
  }

  if (!changed) return undefined

  return {
    code: ms.toString(),
    map: ms.generateMap({ hires: true, source: filePath }),
  }
}
