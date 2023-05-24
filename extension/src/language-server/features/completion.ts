import {
  CompletionItem,
  CompletionItemKind,
  ProtocolRequestType,
  CompletionResolveRequest,
  CompletionRequest,
} from 'vscode-languageserver'
import { PandaExtension } from '..'
import { stringifiedValue } from '../utils/tokens'
import { ts } from 'ts-morph'
import { normalizeStyleObject, walkObject, withoutImportant } from '@pandacss/shared'
import { ResultItem } from '@pandacss/types'

export function registerCompletion(extension: PandaExtension) {
  const { connection, documents, documentReady, parseSourceFile, debugMessage } = extension

  // This handler provides the initial list of the completion items.
  connection.onCompletion(async (params) => {
    await documentReady('✅ onCompletion')
    // console.log(params)

    const items: CompletionItem[] = []
    const completion: CompletionItem = {
      label: 'ouiouioui',
      detail: '🐼 detailsdetailsdetails',
      insertText: `{$ouiouioui}`,
      kind: CompletionItemKind.EnumMember,
      sortText: 'z' + 'ouiouioui',
    }
    items.push({
      label: 'ouiouioui',
      detail: '🐼 detailsdetailsdetails2',
      insertText: `{$ouiouioui}`,
      kind: CompletionItemKind.Color,
      sortText: 'z' + 'ouiouioui',
    })
    items.push({
      label: 'blue.100',
      detail:
        '🐼 const { connection, documentReady, documents, getClosestToken } = context\nconnection.onHover(async (params) => {\nawait documentReady(',
      insertText: `{$ouiouioui}`,
      kind: CompletionItemKind.Constant,
      sortText: 'z' + 'ouiouioui',
    })
    items.push(completion)

    return items

    return []
  })

  // This handler resolves additional information for the item selected in the completion list.
  connection.onCompletionResolve(async (item) => {
    await documentReady('✅ onCompletionRESOLVE')
    return item
  })
}
