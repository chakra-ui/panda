import { ServerCapabilities, TextDocumentSyncKind } from 'vscode-languageserver'

export const capabilities: ServerCapabilities = {
  textDocumentSync: TextDocumentSyncKind.Incremental,
  inlayHintProvider: {
    resolveProvider: false,
  },

  completionProvider: {
    resolveProvider: true,
    completionItem: {
      labelDetailsSupport: true,
    },
  },
  definitionProvider: false,
  hoverProvider: true,
  colorProvider: true,
  inlineValueProvider: true,
}
