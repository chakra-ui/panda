import { InlayHint, InlayHintKind, InlayHintParams } from 'vscode-languageserver'
import { PandaExtension } from '..'
import { printTokenValue } from '../tokens/utils'
import { tryCatch } from 'lil-fp/func'
import { onError } from '../tokens/error'

export function registerInlayHints(context: PandaExtension) {
  const {
    connection,
    documents,
    documentReady,
    loadPandaContext,
    getContext,
    parseSourceFile,
    getFileTokens,
    getPandaSettings,
  } = context

  connection.languages.inlayHint.on(
    tryCatch(async (params: InlayHintParams) => {
      const settings = await getPandaSettings()
      if (!settings['inlay-hints.enabled']) return

      await documentReady('🐼 inlay hints')

      // await when the server starts, then just get the context
      if (!getContext()) {
        await loadPandaContext(params.textDocument.uri)
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
            label: printTokenValue(match.token, settings),
            kind: InlayHintKind.Type,
            paddingLeft: true,
          })
        }
      })

      return inlayHints
    }, onError),
  )
}
