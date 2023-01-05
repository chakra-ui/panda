import parser from 'postcss-selector-parser'
import { match } from 'ts-pattern'
import { parseCondition } from './parse-condition'

export function extractParentSelectors(selector: string) {
  const result: Set<string> = new Set()

  parser((selectors) => {
    //
    selectors.each((selector) => {
      //
      const condition = parseCondition(selector.toString())
      match(condition)
        .with({ type: 'parent-nesting' }, () => {
          result.add(selector.toString().replace(/\s&/g, '').trim())
        })
        .otherwise(() => {
          //
        })
    })
  }).processSync(selector)

  const finalized = Array.from(result).join(', ').trim()

  return result.size > 1 ? `:where(${finalized})` : finalized
}
