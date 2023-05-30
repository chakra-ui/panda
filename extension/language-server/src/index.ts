import { createConnection, TextDocuments, ProposedFeatures } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { setupBuilder } from './setup-builder'
import { setupTokensHelpers } from './tokens/setup-tokens-helpers'
import * as features from './features'

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument)

// Initialize extension.
const setup = setupBuilder(connection, documents)

// Some document helpers that needs to have access to tokens manager but still gets injected through context.
const tokensHelpers = setupTokensHelpers(setup)

const isDebug = false

/**
 * Debug message helper
 */
function debug(message: string) {
  isDebug && connection.console.log(message)
}

/**
 * Check await until tokens are synchronized if a synchronization process is happening.
 */
async function documentReady(step: string) {
  try {
    if (setup.isSynchronizing()) {
      await setup.isSynchronizing()
    }
    debug(step)
  } catch (error) {
    connection.console.error('error on step ' + step)
    connection.console.error(error)
  }
}

/**
 * Extension context to be injected into features.
 */
const extension = {
  connection,
  documents,
  debug,
  documentReady,
  ...setup,
  ...tokensHelpers,
} as const

/**
 * Register each language server feature with extension context.
 */
Object.entries(features).forEach(([key, registerFeature]) => {
  debug(`🐼 Feature: ${key}`)
  registerFeature(extension)
})

export type PandaExtension = typeof extension
