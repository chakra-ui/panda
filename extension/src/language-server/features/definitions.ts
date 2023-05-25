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

    // TODO
  })
}
