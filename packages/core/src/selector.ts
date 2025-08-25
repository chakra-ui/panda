import parser from 'postcss-selector-parser'
import { match } from 'ts-pattern'
import { parseCondition } from './parse-condition'

const parentNestingRegex = /\s&/g

export function extractParentSelectors(selector: string) {
  const result: Set<string> = new Set()

  parser((selectors) => {
    //
    selectors.each((selector) => {
      //
      const condition = parseCondition(selector.toString())
      match(condition)
        .with({ type: 'parent-nesting' }, () => {
          result.add(selector.toString().replace(parentNestingRegex, '').trim())
        })
        .otherwise(() => {
          //
        })
    })
  }).processSync(selector)

  const finalized = Array.from(result).join(', ').trim()

  return result.size > 1 ? `:where(${finalized})` : finalized
}

export function extractTrailingPseudos(selector: string): [string, string] | [null, string] {
  const ast = parser((selectors) => selectors).astSync(selector)

  const matrix: any[][] = []

  for (const [i, sel] of ast.nodes.entries()) {
    for (const [j, child] of [...sel.nodes].reverse().entries()) {
      if (child.type !== 'pseudo' || !child.value.startsWith('::')) {
        break
      }

      matrix[j] = matrix[j] || []
      matrix[j][i] = child
    }
  }

  const trailingPseudos = parser.selector({ value: '' })

  for (const pseudos of matrix) {
    if (!pseudos) continue

    const values = new Set(pseudos.map((p: any) => p.value))
    if (values.size > 1) break

    pseudos.forEach((pseudo: any) => pseudo.remove())
    trailingPseudos.prepend(pseudos[0])
  }

  if (trailingPseudos.nodes.length) {
    return [trailingPseudos.toString(), ast.toString()]
  }

  return [null, selector]
}
