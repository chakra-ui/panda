import postcss, { AtRule, type ChildNode, Container, Rule } from 'postcss'
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
  rule: Container | undefined
  selector = ''
  nodes: ChildNode[] = []

  constructor(private conditionsMap: StylesheetContext['conditions']) {}

  get isEmpty() {
    return this.nodes.length === 0
  }

  update = () => {
    this.rule = postcss.rule({ selector: this.selector, nodes: this.nodes })
  }

  applyConditions = (conditions: string[]) => {
    const sorted = this.conditionsMap.sort(conditions)
    // console.log({ conditions, sorted })
    const rule = postcss.rule({ selector: this.selector })

    sorted.forEach((cond) => {
      if (!cond) return
      const selector = cond.rawValue ?? cond.value
      const last = getDeepestNode(rule)
      const node = last ?? rule
      node.append(postcss.rule({ selector }))
    })

    getDeepestNode(rule)?.append(this.nodes)

    this.rule = rule
  }

  toString() {
    return this.rule!.toString()
  }
}

// recursive function to get the last descendant of a node (deepest child)
function getDeepestNode(node: AtRule | Rule): Rule | AtRule | undefined {
  if (node.nodes && node.nodes.length) {
    return getDeepestNode(node.nodes[node.nodes.length - 1] as AtRule | Rule)
  }
  return node
}
