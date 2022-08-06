import { walkObject } from '@css-panda/walk-object'
import postcss, { AtRule, Rule } from 'postcss'
import { match } from 'ts-pattern'
import { getSortedConditions } from './condition'
import { SelectorOutput } from './selector-output'
import { toCss } from './to-css'
import { Dict, GeneratorContext } from './types'
import { wrap } from './wrap'

export function generate(
  styles: Dict,
  options?: {
    scope?: string
  },
) {
  const { scope } = options ?? {}

  return (ctx: GeneratorContext) => {
    //
    walkObject(styles, (value, paths) => {
      let [prop, ...conditions] = paths

      // remove default condition
      conditions = conditions.filter((condition) => condition !== '_')

      // allow users transform the generated class and styles
      const transformed = ctx.transform(prop, value)

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles)
      const rawNodes = cssRoot.root.nodes

      // get the base class name
      const baseArray = [...conditions, transformed.className]
      if (scope) {
        baseArray.unshift(`[${scope}]`)
        conditions.push(scope.replace('&', 'this'))
      }

      const output = new SelectorOutput(baseArray.join(':'))

      // create base rule
      let rule: AtRule | Rule = postcss.rule({
        selector: output.selector,
        nodes: rawNodes,
      })

      // expand conditions and sort based on the insertion order
      const sortedConditions = getSortedConditions(conditions, ctx.conditions)

      for (const cond of sortedConditions) {
        //
        match(cond)
          .with({ type: 'parent-selector' }, (data) => {
            const finalized = output.parentSelector(data.raw)
            rule = postcss.rule({
              selector: finalized.selector,
              nodes: rawNodes,
            })
          })
          .with({ type: 'pseudo-selector' }, (data) => {
            const finalized = output.pseudoSelector(data.raw)
            rule = postcss.rule({
              selector: finalized.selector,
              nodes: rawNodes,
            })
          })
          .with({ type: 'at-rule' }, (data) => {
            rule = wrap(rule, {
              type: data.type,
              name: data.name!,
              params: data.value,
            })
          })
          .exhaustive()
      }

      ctx.root.append(rule)
    })
  }
}
