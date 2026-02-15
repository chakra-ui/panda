import MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { ParserResultInterface } from '@pandacss/types'
import { inlineCssCall } from './css'
import { inlineCvaCall } from './cva'
import { inlinePatternCall } from './pattern'
import { inlineSvaCall } from './sva'
import { CVA_HELPER, SVA_HELPER } from './runtime'

export function inlineFile(
  code: string,
  filePath: string,
  parserResult: ParserResultInterface,
  ctx: PandaContext,
): { code: string; map: any } | undefined {
  const ms = new MagicString(code)
  let changed = false
  let needsCvaHelper = false
  let needsSvaHelper = false

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

  // Inline cva() calls
  for (const item of parserResult.cva) {
    if (inlineCvaCall(ms, item, ctx)) {
      changed = true
      needsCvaHelper = true
    }
  }

  // Inline sva() calls
  for (const item of parserResult.sva) {
    if (inlineSvaCall(ms, item, ctx)) {
      changed = true
      needsCvaHelper = true // sva slots use __cva internally
      needsSvaHelper = true
    }
  }

  if (!changed) return undefined

  // Inject runtime helpers at the top of the file
  if (needsSvaHelper) ms.prepend(SVA_HELPER)
  if (needsCvaHelper) ms.prepend(CVA_HELPER)

  return {
    code: ms.toString(),
    map: ms.generateMap({ hires: true, source: filePath }),
  }
}
