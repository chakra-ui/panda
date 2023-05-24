import { PandaExtension } from '../index'

// TODO inline hints for px -> rem

export function registerHover(extension: PandaExtension) {
  const { connection, documentReady, documents, getClosestToken, getClosestInstance, getMarkdownCss, printTokenValue } =
    extension

  connection.onHover(async (params) => {
    await documentReady('🐼 onHover')

    const ctx = extension.getContext()
    if (!ctx) return

    const doc = documents.get(params.textDocument.uri)
    if (!doc) {
      return
    }

    // TODO recipe
    const tokenMatch = getClosestToken(doc, params.position)
    if (tokenMatch) {
      const { token } = tokenMatch
      const css = getMarkdownCss(ctx, { [token.name]: token.value }).css
      // console.log(match)

      return {
        contents: [printTokenValue(token), { language: 'css', value: css }],
      }
    }

    const instanceMatch = getClosestInstance(doc, params.position)
    if (instanceMatch) {
      return {
        contents: getMarkdownCss(ctx, instanceMatch.styles).withCss,
      }
    }
  })
}
