import { tryCatch } from 'lil-fp/func'
import type { PandaExtension } from '../index'
import { onError } from '../tokens/error'

export function registerCompletion(extension: PandaExtension) {
  const { connection, documents, documentReady, getClosestCompletionList } = extension

  // This handler provides the initial list of the completion items.
  connection.onCompletion(
    tryCatch(async (params) => {
      await documentReady('✅ onCompletion')

      const doc = documents.get(params.textDocument.uri)
      if (!doc) {
        return
      }

      // TODO recipe
      const matches = getClosestCompletionList(doc, params.position)
      if (!matches) {
        return
      }

      return matches
    }, onError),
  )

  // This handler resolves additional information for the item selected in the completion list.
  connection.onCompletionResolve((item) => item)
}
