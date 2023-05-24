import { CompletionItem, CompletionItemKind, TextDocumentPositionParams } from 'vscode-languageserver'
import { PandaExtension } from '..'
import { stringifiedValue } from '../utils/tokens'
import { ts } from 'ts-morph'
import { normalizeStyleObject, walkObject, withoutImportant } from '@pandacss/shared'
import { ResultItem } from '@pandacss/types'

export function registerCompletion(extension: PandaExtension) {
  const { connection, documents, documentReady, parseSourceFile } = extension

  // This handler provides the initial list of the completion items.
  connection.onCompletion(async (textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[]> => {
    await documentReady('✅ onCompletion')

    const ctx = extension.getContext()
    if (!ctx) {
      connection.console.log('🐼 Extension context not ready')
      return []
    }

    const doc = documents.get(textDocumentPosition.textDocument.uri)
    if (!doc) {
      return []
    }

    const parserResult = parseSourceFile(doc)
    console.log(parserResult)
    if (!parserResult) {
      return []
    }

    const sourceFile = extension.getSourceFile(doc)
    if (!sourceFile) {
      return []
    }

    const position = textDocumentPosition.position
    const pos = ts.getPositionOfLineAndCharacter(
      sourceFile.compilerNode,
      // TS uses 0-based line and char #s
      position.line,
      position.character,
    )
    console.log({ line: position.line, column: position.character, character: pos })

    // const node = sourceFile.getDescendantAtPos(pos)

    // parserResult.pattern.forEach(onResult)
    // TODO recipe

    // console.log(dict.allNames)
    // console.log(Object.keys(dict.categoryMap), dict.allTokens)

    return []

    // Create completion symbols
    const items: CompletionItem[] = []
    if (isTokenFunctionCall) {
      Object.entries(parserResult || {}).forEach(([key, localToken]) => {
        const path = key.replace(/^--/, '').split('-').join('.')
        const completion: CompletionItem = {
          label: path,
          detail: printAst(localToken).code,
          insertText: `{${path}}`,
          kind: CompletionItemKind.EnumMember,
          sortText: 'z' + path,
        }
        items.push(completion)
      })

      ctx.tokens.allTokens.forEach((token) => {
        if (!token?.name || !token?.value) {
          return
        }

        const insertText = isTokenFunctionCall ? token?.name : `{${token.name}}`

        const originalString = stringifiedValue({ value: token?.original })
        const configValue = originalString ? `🐼 Config value:\n${originalString}` : undefined
        const stringValue = stringifiedValue(token)
        const sourcePath = token?.definition?.uri.replace(rootPath || '', '')
        const source = sourcePath ? `📎 Source:\n${sourcePath}` : ''

        const completion: CompletionItem = {
          label: token?.name,
          detail: stringValue?.split?.('\n')?.[0],
          documentation: `${configValue}${sourcePath ? '\n\n' + source : ''}`,
          insertText,
          kind: CompletionItemKind.Color,
          sortText: 'z' + token?.name,
        }

        items.push(completion)
      })
    }

    return items
  })

  // This handler resolves additional information for the item selected in the completion list.
  connection.onCompletionResolve((item: CompletionItem): CompletionItem => item)
}
