import { createParserResult } from '@pandacss/parser'
import type { Context } from '../../engines'
import { generateParserCss } from './parser-css'
import { P, match } from 'ts-pattern'
import type { ResultItem } from '@pandacss/types'

export const generateVendorsCss = (ctx: Context) => {
  if (!ctx.config.vendorsCss?.length) return ''

  const getParserCss = generateParserCss(ctx)
  const parserResult = createParserResult()

  ctx.config.vendorsCss.forEach((vendor) => {
    vendor.ast.forEach((dataItem) => {
      const resultItem = dataItem as ResultItem
      match(resultItem)
        .with({ name: P.union('css', 'cva') }, () => parserResult.set(resultItem.name as any, resultItem))
        .with({ type: P.union('pattern', 'jsx-pattern') }, () =>
          parserResult.setPattern(resultItem.name as any, resultItem),
        )
        .with({ type: P.union('recipe', 'jsx-recipe') }, () =>
          parserResult.setRecipe(resultItem.name as any, resultItem),
        )
        //
        .with({ type: 'cva' }, () => parserResult.setCva(resultItem))
        .with({ type: P.union('jsx', 'jsx-factory') }, () => parserResult.setJsx(resultItem))
        .otherwise(() => {
          //
        })
    })
  })

  return getParserCss(parserResult)
}
