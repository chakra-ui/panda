import { Diagnostic } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { PandaExtension } from '..'

// TODO : Move to settings (extension configuration)
let missingTokenHintSeverity = 'warning'

export function registerDiagnostics(context: PandaExtension) {
  const {
    connection,
    documents,
    debugMessage,
    loadPandaContext: getPandaContext,
    parseSourceFile,
    getFileTokens,
  } = context

  return

  function updateDocumentDiagnostics(doc: TextDocument) {
    const text = doc.getText()
    const diagnostics: Diagnostic[] = []
    const parserResult = parseSourceFile(doc)

    if (parserResult) {
      getFileTokens(doc, parserResult, ({ range, token, tokenPath, match, localToken }) => {
        if (!token && !localToken && !tokenPath.includes(' ') && text.charAt(match.index - 1) !== '$') {
          debugMessage(`🐼 Token not found: ${tokenPath}`)

          const settingsSeverity = (['error', 'warning', 'information', 'hint', 'disable'].indexOf(
            missingTokenHintSeverity,
          ) + 1) as 1 | 2 | 3 | 4 | 5

          if (settingsSeverity === 5) {
            return
          }

          diagnostics.push({
            message: `🐼 Token '${tokenPath}' not found.`,
            range: {
              start: {
                character: range.start.character + 1,
                line: range.start.line,
              },
              end: {
                character: range.end.character + 1,
                line: range.start.line,
              },
            },
            severity: settingsSeverity,
            code: tokenPath,
          })
        }
      })
    }

    connection.sendDiagnostics({
      uri: doc.uri,
      version: doc.version,
      diagnostics,
    })
  }

  // Update diagnostics on document change
  documents.onDidChangeContent(async (params) => {
    await getPandaContext()
    updateDocumentDiagnostics(params.document)
  })

  // Update diagnostics when watched file changes
  connection.onDidChangeWatchedFiles(async (_change) => {
    await getPandaContext()

    // Update all opened documents diagnostics
    const docs = documents.all()
    docs.forEach((doc) => updateDocumentDiagnostics(doc))
  })
}
