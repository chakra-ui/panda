import { ColorInformation } from 'vscode'
import type { PinceauExtension } from '../index'

export function registerColorHints (
  context: PinceauExtension
) {
  const { connection, documents, documentReady, getDocumentSettings, getDocumentTokensData, getDocumentTokens } = context

  connection.onDocumentColor(async (params): Promise<ColorInformation[]> => {
    await documentReady('🎨 onDocumentColor')

    const doc = documents.get(params.textDocument.uri)
    if (!doc) { return [] }

    const colors: ColorInformation[] = []

    const settings = await getDocumentSettings()

    const tokensData = getDocumentTokensData(doc)

    getDocumentTokens(
      doc,
      tokensData,
      settings,
      ({ range, token }) => {
        if ((token as any)?.color) {
          colors.push({
            color: (token as any)?.color,
            range: range as any
          })
        }
      }
    )

    return colors
  })

  connection.onColorPresentation(async (params) => {
    await documentReady('🎨 onColorPresentation')

    const document = documents.get(params.textDocument.uri)
    const className = document.getText(params.range)

    console.log(className)

    if (!className) { return [] }

    return []
  })
}
