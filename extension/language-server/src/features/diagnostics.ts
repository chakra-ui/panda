import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { PandaExtension } from '..'
import { tryCatch } from 'lil-fp/func'
import { onError } from '../tokens/error'

export function registerDiagnostics(context: PandaExtension) {
  const { connection, debug, documents, loadPandaContext, getContext, parseSourceFile, getFileTokens } = context

  const updateDocumentDiagnostics = tryCatch(function (doc: TextDocument) {
    debug(`Update diagnostics for ${doc.uri}`)

    const diagnostics: Diagnostic[] = []
    const parserResult = parseSourceFile(doc)

    if (!parserResult) return

    getFileTokens(doc, parserResult, (match) => {
      if (match.kind === 'token' && match.token.extensions.kind === 'invalid-token-path') {
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
    const ctx = await loadPandaContext()
    if (!ctx) return

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
