import { ServerCapabilities, TextDocumentSyncKind } from 'vscode-languageserver'

export const serverCapabilities: ServerCapabilities = {
  textDocumentSync: TextDocumentSyncKind.Incremental,
  inlayHintProvider: {
    resolveProvider: false,
  },
  workspace: {
    workspaceFolders: {
      supported: true,
      changeNotifications: true,
    },
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
