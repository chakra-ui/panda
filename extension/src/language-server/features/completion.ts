import { printAst } from 'pinceau/utils'
import { CompletionItem, CompletionItemKind, TextDocumentPositionParams } from 'vscode-languageserver'
import { PinceauExtension } from '..'
import { getCursorContext } from '../utils/getCursorContext'
import { stringifiedValue } from '../utils/tokens'

export function registerCompletion (
  context: PinceauExtension
) {
  const { connection, documents, tokensManager, documentReady, rootPath, getDocumentTokensData } = context

  // This handler provides the initial list of the completion items.
  connection.onCompletion(async (_textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[]> => {
    await documentReady('✅ onCompletion')

    const doc = documents.get(_textDocumentPosition.textDocument.uri)
    if (!doc) { return [] }

    const tokensData = getDocumentTokensData(doc)

    const { isInStringExpression, isOffsetOnStyleTsTag, isTokenFunctionCall } = getCursorContext(doc, _textDocumentPosition.position, tokensData?.styles)

    // Create completion symbols
    const items: CompletionItem[] = []
    if (isTokenFunctionCall || ((doc.uri.includes('tokens.config.ts') || isOffsetOnStyleTsTag) && isInStringExpression)) {
      Object.entries(tokensData?.localTokens || {}).forEach(
        ([key, localToken]: [string, any]) => {
          const path = key.replace(/^--/, '').split('-').join('.')
          const completion: CompletionItem = {
            label: path,
            detail: printAst(localToken).code,
            insertText: `{${path}}`,
            kind: CompletionItemKind.EnumMember,
            sortText: 'z' + path
          }
          items.push(completion)
        }
      )
      tokensManager.getAll().forEach((token: any) => {
        if (!token?.name || !token?.value) { return }

        const insertText = isTokenFunctionCall ? token?.name : `{${token.name}}`

        const originalString = stringifiedValue({ value: token?.original })
        const configValue = originalString ? `🎨 Config value:\n${originalString}` : undefined
        const stringValue = stringifiedValue(token)
        const sourcePath = token?.definition?.uri.replace(rootPath || '', '')
        const source = sourcePath ? `📎 Source:\n${sourcePath}` : ''

        const completion: CompletionItem = {
          label: token?.name,
          detail: stringValue?.split?.('\n')?.[0],
          documentation: `${configValue}${sourcePath ? '\n\n' + source : ''}`,
          insertText,
          kind: CompletionItemKind.Color,
          sortText: 'z' + token?.name
        }

        items.push(completion)
      })
    }
    return items
  }
  )

  // This handler resolves additional information for the item selected in the completion list.
  connection.onCompletionResolve((item: CompletionItem): CompletionItem => item)
}
