import { ColorInformation } from 'vscode'
import type { PandaExtension } from '../index'
import { color2kToVsCodeColor } from '../tokens/color2k-to-vscode-color'

export function registerColorHints(extension: PandaExtension) {
  const { connection, documents, documentReady, parseSourceFile, getFileTokens } = extension

  connection.onDocumentColor(async (params) => {
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
      if (match.kind === 'token' && match.token.extensions?.vscodeColor) {
        // Add 1 color hint for each condition
        if (match.token.extensions.conditions) {
          Object.entries(match.token.extensions.conditions).forEach(([_name, value]) => {
            const [tokenRef] = ctx.tokens.getReferences(value)
            const color = color2kToVsCodeColor(tokenRef.value)
            if (!color) return

            colors.push({ color, range: match.range as any })
          })

          return
        }

        colors.push({
          color: match.token.extensions.vscodeColor,
          range: match.range as any,
        })
      }
    })

    return colors
  })

  connection.onColorPresentation((_params) => {
    return []
  })
}
