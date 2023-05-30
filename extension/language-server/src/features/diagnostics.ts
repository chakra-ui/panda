import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { PandaExtension } from '..'
import { tryCatch } from 'lil-fp/func'
import { onError } from '../tokens/error'

export function registerDiagnostics(context: PandaExtension) {
  const {
    connection,
    debug,
    documents,
    loadPandaContext,
    getContext,
    parseSourceFile,
    getFileTokens,
    getPandaSettings,
  } = context

  const updateDocumentDiagnostics = tryCatch(async function (doc: TextDocument) {
    const settings = await getPandaSettings()
    if (!settings['diagnostics.enabled']) {
      // this allows us to clear diagnostics
      return connection.sendDiagnostics({
        uri: doc.uri,
        version: doc.version,
        diagnostics: [],
      })
    }

    debug(`Update diagnostics for ${doc.uri}`)

    const diagnostics: Diagnostic[] = []
    const parserResult = parseSourceFile(doc)

    if (!parserResult) {
      // this allows us to clear diagnostics
      return connection.sendDiagnostics({
        uri: doc.uri,
        version: doc.version,
        diagnostics: [],
      })
    }

    getFileTokens(doc, parserResult, (match) => {
      if (
        match.kind === 'token' &&
        match.token.extensions.kind === 'invalid-token-path' &&
        settings['diagnostics.invalid-token-path']
      ) {
        diagnostics.push({
          message: `🐼 Invalid token path`,
          range: match.range,
          severity: DiagnosticSeverity.Error,
          code: match.token.name,
        })
      }
    })

    connection.sendDiagnostics({
      uri: doc.uri,
      version: doc.version,
      diagnostics,
    })
  }, onError)

  // Update diagnostics on document change
  documents.onDidChangeContent(async (params) => {
    // await when the server starts, then just get the context
    if (!getContext()) {
      await loadPandaContext()
    }

    if (!getContext()) return

    updateDocumentDiagnostics(params.document)
  })

  // Update diagnostics when watched file changes
  connection.onDidChangeWatchedFiles((_change) => {
    const ctx = getContext()
    if (!ctx) return

    // Update all opened documents diagnostics
    const docs = documents.all()
    docs.forEach((doc) => updateDocumentDiagnostics(doc))
  })
}
