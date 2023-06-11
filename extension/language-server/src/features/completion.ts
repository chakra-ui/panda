import { tryCatch } from 'lil-fp/func'
import type { PandaExtension } from '../index'
import { onError } from '../tokens/error'

export function registerCompletion(extension: PandaExtension) {
  const { connection, documents, documentReady, getClosestCompletionList, getPandaSettings } = extension

  // This handler provides the initial list of the completion items.
  connection.onCompletion(
    tryCatch(async (params) => {
      const isEnabled = await getPandaSettings('completions.enabled')
      if (!isEnabled) return

      await documentReady('✅ onCompletion')

      const doc = documents.get(params.textDocument.uri)
      if (!doc) {
        return
      }

      // TODO recipe
      const matches = await getClosestCompletionList(doc, params.position)
      if (!matches?.length) {
        return
      }

      return matches
    }, onError),
  )

  // This handler resolves additional information for the item selected in the completion list.
  connection.onCompletionResolve((item) => item)
}
