import { match, P } from 'ts-pattern'
import type { VElement } from 'vue-eslint-parser/ast'
import { AST } from 'vue-eslint-parser'
import { extractValue } from './literal'
import { Node } from './node'

export function visitVElement(
  children: VElement['children'] | undefined,
  options: {
    match: { prop: (element: { tag: string; name: string }) => boolean; tag: (name: string) => boolean }
    fn(result: { name: string; data: any }): void
  },
) {
  const { match: matchProp, fn } = options

  for (const child of children ?? []) {
    AST.traverseNodes(child, {
      leaveNode(node) {
        return node
      },
      enterNode(node) {
        match(node)
          .with(
            {
              type: 'VElement',
              name: P.select('tag'),
              startTag: { attributes: P.select('attrs') },
            },
            ({ attrs, tag }) => {
              if (!tag || !matchProp.tag(tag)) {
                return
              }

              const data: Record<string, any> = {}

              for (const attr of attrs) {
                const name = match(attr.key)
                  .with({ type: 'VDirectiveKey', argument: { name: P.select() } }, (key) => key)
                  .with({ type: 'VIdentifier', name: P.select() }, (key) => key)
                  .otherwise(() => null)

                if (!name || !matchProp.prop({ tag, name })) {
                  continue
                }

                match(attr.value)
                  .when(Node.isStringLiteral, ({ value }) => {
                    data[name] = value.replaceAll(/[\n\s]+/g, ' ')
                  })
                  .when(Node.isJsxExpression, ({ expression: expr }) => {
                    const returnValue = extractValue(expr)
                    if (returnValue !== undefined) {
                      data[name] = returnValue
                    }
                  })
                  .otherwise(() => {
                    if (!attr.value) {
                      data[name] = ''
                    }
                  })
              }

              fn({ name: tag, data })
            },
          )
          .otherwise(() => void 0)
      },
    })
  }
}
