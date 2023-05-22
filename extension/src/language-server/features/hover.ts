
import { printAst } from 'pinceau/utils'
import { PinceauExtension } from '../index'
import { stringifiedValue } from '../utils/tokens'

export function registerHover (
  context: PinceauExtension
) {
  const { connection, documentReady, documents, getDocumentTokensData, getClosestToken } = context

  connection.onHover(async (params) => {
    await documentReady('📘 onHover')

    const doc = documents.get(params.textDocument.uri)
    if (!doc) { return }

    const tokensData = getDocumentTokensData(doc)

    const { token, localToken } = getClosestToken(doc, params.position, tokensData)

    if (localToken) { return { contents: `📍 \`\`\`\n${printAst(localToken).code}\n\`\`\``, code: '', message: '', data: {}, name: '' } }

    if (token) { return { contents: `🎨 ${stringifiedValue(token)}`, code: '', message: '', data: {}, name: '' } }
  })
}
