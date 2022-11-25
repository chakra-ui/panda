import postcss, { AtRule, ChildNode, Rule } from 'postcss'
import { match } from 'ts-pattern'
import type { StylesheetContext } from './types'

export type WrapOptions =
  | {
      type: 'selector'
      name: string
    }
  | {
      type: 'at-rule'
      name: string
      params: string
    }

export class ConditionalRule {
  rule: Rule | AtRule | undefined
  selector = ''
  nodes: ChildNode[] = []

  constructor(private conditionsMap: StylesheetContext['conditions']) {}

  private wrap = (options: WrapOptions) => {
    if (!this.rule) return
    const parent = match(options)
      .with({ type: 'at-rule' }, ({ name, params }) => postcss.atRule({ name, params }))
      .with({ type: 'selector' }, ({ name }) => postcss.rule({ selector: name }))
      .exhaustive()

    const cloned = this.rule.clone()

    parent.append(cloned)
    this.rule.remove()

    return parent
  }

  private expandNesting = (scope: string) => {
    return scope.replace(RegExp('&', 'g'), this.selector)
  }

  get isEmpty() {
    return this.nodes.length === 0
  }

  update = () => {
    this.rule = postcss.rule({ selector: this.selector, nodes: this.nodes })
  }

  applyConditions = (conditions: string[]) => {
    const sorted = this.conditionsMap.sort(conditions)

    for (const cond of sorted) {
      if (!cond) continue

      match(cond)
        .with({ type: 'at-rule' }, (data) => {
          this.rule = this.wrap({
            type: 'at-rule',
            name: data.name!,
            params: data.value,
          })
        })
        .otherwise(() => {
          this.selector = this.expandNesting(cond.raw)
          this.update()
        })
    }
  }

  toString() {
    return this.rule!.toString()
  }
}
