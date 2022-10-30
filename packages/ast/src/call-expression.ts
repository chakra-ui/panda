import { Node, SourceFile, ts } from 'ts-morph'
import { extractObjectLiteral } from './literal'

export function visitCallExpressions(
  file: SourceFile,
  options: {
    match: (name: string) => boolean
    fn(result: { name: string; data: any }): void
  },
) {
  const { match, fn } = options

  const callExpressions = file.getDescendantsOfKind(ts.SyntaxKind.CallExpression)

  for (const node of callExpressions) {
    const expr = node.getExpression()
    const name = expr.getText()

    if (!match(name)) return

    const args = node.getArguments()

    if (args.length === 0) {
      fn({ name, data: {} })
      return
    }

    args.forEach((arg) => {
      if (Node.isObjectLiteralExpression(arg)) {
        fn({ name, data: extractObjectLiteral(arg) })
      }
    })
  }
}
