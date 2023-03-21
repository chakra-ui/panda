import { match, P } from 'ts-pattern'
import { AST } from 'vue-eslint-parser'
import type { VElement } from 'vue-eslint-parser/ast'
import { noop, type Options } from './index'
import { extractObjectLiteral } from './literal'

export function visitCallExpressions(children: VElement['children'] | undefined, options: Options) {
  const { match: check, fn } = options

  for (const child of children ?? []) {
    if (child.type !== 'VElement') continue

    AST.traverseNodes(child, {
      leaveNode(node) {
        return node
      },
      enterNode(node) {
        match(node)
          .with(
            { type: 'VElement', startTag: { attributes: P.select('attrs') }, name: P.select('tag') },
            ({ attrs }) => {
              attrs.forEach((attr) => {
                match(attr)
                  .with(
                    {
                      type: 'VAttribute',
                      value: { type: 'VExpressionContainer', expression: P.select() },
                    },
                    (expr) => {
                      match(expr)
                        .with(
                          {
                            type: 'CallExpression',
                            callee: { name: P.select('name') },
                            arguments: P.select('args'),
                          },
                          ({ name, args }) => {
                            if (!check(name)) return

                            if (args.length === 0) {
                              fn({ name, data: {} })
                            }

                            args.forEach((arg) => {
                              match(arg)
                                .with({ type: 'ObjectExpression' }, (props) => {
                                  fn({ name, data: extractObjectLiteral(props) })
                                })
                                .otherwise(noop)
                            })
                          },
                        )
                        .otherwise(noop)
                    },
                  )
                  .otherwise(noop)
              })
            },
          )
          .otherwise(noop)
      },
    })
  }
}
