import { createConnection, TextDocuments, ProposedFeatures } from 'vscode'
import { TextDocument } from 'vscode'
import type { SFCStyleBlock } from '@vue/compiler-sfc'
import PinceauTokensManager from './manager'
import { setupExtension } from './config'
import { setupTokensHelpers } from './features/tokens'
import * as features from './features'

export type DocumentTokensData = {
  version: number
  styles: SFCStyleBlock[]
  variants: any
  computedStyles: any
  localTokens: any
}

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

// Tokens cache manager.
const tokensManager = new PinceauTokensManager()

// Initialize extension.
const context = setupExtension(connection, tokensManager, documents)

// Some document helpers that needs to have access to tokens manager but still gets injected through context.
const tokensHelpers = setupTokensHelpers(tokensManager)

/**
 * Debug message helper
 */
function debugMessage(message: string) {
  context.debug && connection.console.log(message)
}

/**
 * Check await until tokens are synchronized if a synchronization process is happening.
 */
async function documentReady(step: string) {
  if (tokensManager.synchronizing) {
    await tokensManager.synchronizing
  }
  debugMessage(step)
}

/**
 * Extension context to be injected into features.
 */
const extension = {
  connection,
  documents,
  tokensManager,
  debugMessage,
  documentReady,
  ...context,
  ...tokensHelpers,
} as const

/**
 * Register each language server feature with extension context.
 */
Object.entries(features).forEach(([key, registerFeature]) => {
  debugMessage(`🖌️ Registering ${key}`)
  registerFeature(extension)
})

export type PinceauExtension = typeof extension
