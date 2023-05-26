import { InlayHint, InlayHintKind } from 'vscode-languageserver'
import { PandaExtension } from '..'
import { printTokenValue } from '../tokens/utils'

export function registerInlayHints(context: PandaExtension) {
  const { connection, documents, loadPandaContext, getContext, parseSourceFile, getFileTokens } = context

  connection.languages.inlayHint.on(async (params) => {
    // await when the server starts, then just get the context
    if (!getContext()) {
      await loadPandaContext()
    }

    const doc = documents.get(params.textDocument.uri)
    if (!doc) {
      return []
    }

    const parserResult = parseSourceFile(doc)
    if (!parserResult) return

    const inlayHints = [] as InlayHint[]

    getFileTokens(doc, parserResult, (match) => {
      if (
        match.kind === 'token' &&
        match.token.extensions.kind !== 'color' &&
        match.token.extensions.kind !== 'semantic-color' &&
        match.token.extensions.kind !== 'native-color' &&
        match.token.extensions.kind !== 'invalid-token-path'
      ) {
        inlayHints.push({
          position: match.range.end,
          label: printTokenValue(match.token),
          kind: InlayHintKind.Type,
          paddingLeft: true,
        })
      }
    })

    return inlayHints
  })
}
