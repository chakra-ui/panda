import { ColorInformation } from 'vscode-languageserver'
import type { PandaExtension } from '../index'
import { color2kToVsCodeColor } from '../tokens/color2k-to-vscode-color'
import { tryCatch } from 'lil-fp/func'
import { onError } from '../tokens/error'

export function registerColorHints(extension: PandaExtension) {
  const { connection, documents, documentReady, parseSourceFile, getFileTokens, getPandaSettings } = extension

  connection.onDocumentColor(
    tryCatch(async (params) => {
      const settings = await getPandaSettings()
      if (!settings['color-hints.enabled']) return

      await documentReady('🐼 onDocumentColor')

      const doc = documents.get(params.textDocument.uri)
      if (!doc) {
        return []
      }

      const ctx = extension.getContext()
      if (!ctx) return []

      const parserResult = parseSourceFile(doc)
      if (!parserResult) {
        return []
      }

      const colors: ColorInformation[] = []

      getFileTokens(doc, parserResult, (match) => {
        const isColor = match.kind === 'token' && match.token.extensions?.vscodeColor
        if (!isColor) return

        // Add 1 color hint for each condition
        if (match.token.extensions.conditions) {
          if (settings['color-hints.semantic-tokens.enabled']) {
            Object.values(match.token.extensions.conditions).forEach((value) => {
              const [tokenRef] = ctx.tokens.getReferences(value)
              const color = color2kToVsCodeColor(tokenRef.value)
              if (!color) return

              colors.push({ color, range: match.range as any })
            })
          }

          return
        }

        colors.push({
          color: match.token.extensions.vscodeColor,
          range: match.range as any,
        })
      })

      return colors
    }, onError),
  )

  connection.onColorPresentation(() => {
    return []
  })

  connection.onDidChangeConfiguration(async (_change) => {
    connection.sendNotification('$/clear-colors')
  })
}
