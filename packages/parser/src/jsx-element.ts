import { Node, SourceFile, ts } from 'ts-morph'
import { match } from 'ts-pattern'
import { extractValue } from './literal'

export function visitJsxElement(
  file: SourceFile,
  options: {
    match: { prop: (element: { tag: string; name: string }) => boolean; tag: (name: string) => boolean }
    fn(result: { name: string; data: any }): void
  },
) {
  const { match: matchProp, fn } = options

  const elements = [
    ...file.getDescendantsOfKind(ts.SyntaxKind.JsxOpeningElement),
    ...file.getDescendantsOfKind(ts.SyntaxKind.JsxSelfClosingElement),
  ]

  for (const node of elements) {
    const tag = node.getTagNameNode().getText()

    if (!tag || !matchProp.tag(tag)) {
      continue
    }

    const props = node.getAttributes()
    const data: Record<string, any> = {}

    for (const prop of props) {
      if (!Node.isJsxAttribute(prop)) {
        continue
      }

      const name = prop.getName()
      const value = prop.getInitializer()

      if (!tag || !matchProp.prop({ tag, name })) {
        continue
      }

      match(value)
        .when(Node.isStringLiteral, (value) => {
          data[name] = value.getLiteralValue().replaceAll(/[\n\s]+/g, ' ')
        })
        .when(Node.isJsxExpression, (value) => {
          const expr = value.getExpression()
          const returnValue = extractValue(expr)
          if (returnValue !== undefined) {
            data[name] = returnValue
          }
        })
        .otherwise(() => {
          // check boolean prop
          if (!value) {
            data[name] = true
          }
        })
    }

    fn({ name: tag, data })
  }
}
