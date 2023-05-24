import { createConnection, TextDocuments, ProposedFeatures } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { setupExtension } from './config'
import { setupTokensHelpers } from './features/tokens'
import * as features from './features'

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument)

// Initialize extension.
const setup = setupExtension(connection, documents)

// Some document helpers that needs to have access to tokens manager but still gets injected through context.
const tokensHelpers = setupTokensHelpers(setup)

/**
 * Debug message helper
 */
function debugMessage(message: string) {
  connection.console.log(message)
}

/**
 * Check await until tokens are synchronized if a synchronization process is happening.
 */
async function documentReady(step: string) {
  if (setup.isSynchronizing()) {
    await setup.isSynchronizing()
  }
  debugMessage(step)
}

/**
 * Extension context to be injected into features.
 */
const extension = {
  connection,
  documents,
  debugMessage,
  documentReady,
  ...setup,
  ...tokensHelpers,
} as const

/**
 * Register each language server feature with extension context.
 */
Object.entries(features).forEach(([key, registerFeature]) => {
  debugMessage(`🐼 Registering ${key}`)
  registerFeature(extension)
})

export type PandaExtension = typeof extension
