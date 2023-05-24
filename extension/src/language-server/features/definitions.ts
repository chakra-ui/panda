import { Position } from 'vscode-languageserver-textdocument'
import { PandaExtension } from '..'

export function registerDefinitions(context: PandaExtension) {
  const { connection, documents, parseSourceFile, documentReady, getClosestToken } = context

  return

  connection.onDefinition(async (params) => {
    await documentReady('🔗 onDefinition')

    const doc = documents.get(params.textDocument.uri)
    if (!doc) {
      return null
    }

    const parserResult = parseSourceFile(doc)

    const { token, lineRange, localToken } = getClosestToken(doc, params.position)

    if ((token?.definition || localToken) && lineRange) {
      let start: Position
      let end: Position
      if (localToken) {
        start = doc.positionAt(localToken.source.start.offset + localToken.start)
        end = doc.positionAt(localToken.source.start.offset + localToken.end)
      }
      if (token?.definition) {
        start = { character: (token.definition.range.start as any).column, line: token.definition.range.start.line - 1 }
        end = { character: (token.definition.range.start as any).column, line: token.definition.range.start.line - 1 }
      }

      return [
        {
          uri: doc.uri,
          targetUri: token?.definition?.uri || doc.uri,
          range: {
            start: { character: lineRange.start, line: params.position.line },
            end: { character: lineRange.end, line: params.position.line },
          },
          targetRange: {
            start,
            end,
          },
          targetSelectionRange: {
            start,
            end,
          },
          originSelectionRange: {
            start: { line: params.position.line, character: lineRange.start },
            end: { line: params.position.line, character: lineRange.end },
          },
        },
      ]
    }
  })
}
