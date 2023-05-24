import { PandaExtension } from '../index'

// https://github.com/tailwindlabs/tailwindcss-intellisense/blob/master/packages/tailwindcss-language-service/src/hoverProvider.ts#L74
// TODO inline hints for px -> rem
// toPx / toEm / toRem

export function registerHover(context: PandaExtension) {
  const { connection, documentReady, documents, getClosestToken } = context

  connection.onHover(async (params) => {
    await documentReady('🐼 onHover')

    const doc = documents.get(params.textDocument.uri)
    if (!doc) {
      return
    }

    // TODO recipe
    const match = getClosestToken(doc, params.position)
    if (!match) return

    const { token } = match
    // console.log(match)

    return { contents: `🐼 ${token.value}`, code: '', message: '', data: {}, name: '' }
  })
}
