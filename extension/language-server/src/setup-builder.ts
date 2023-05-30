import { Builder } from '@pandacss/node'
import { Connection, InitializeParams, TextDocuments } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { capabilities } from './capabilities'

const ref = {
  context: null as unknown as Builder['context'],
  synchronizing: false as Promise<void> | false,
}

/**
 * Setup extension
 * - Config detection & loading
 */
export function setupBuilder(connection: Connection, documents: TextDocuments<TextDocument>) {
  const builder = new Builder()

  /**
   * Resolve current extension settings
   */
  async function loadPandaContext() {
    try {
      console.log('🚧 Builder setup...')
      ref.synchronizing = builder.setup()
      await ref.synchronizing
    } catch (err) {
      // Ignore
      ref.synchronizing = false
      console.log('❌ Builder setup failed!', err)
      return
    }

    ref.synchronizing = false
    ref.context = builder.context!

    return ref.context
  }

  connection.onInitialize((_params: InitializeParams) => {
    connection.console.log('🤖 Starting PandaCss LSP...')

    connection.onInitialized(async () => {
      const ctx = await loadPandaContext()

      connection.console.log('⚡ Connection initialized!')

      if (ctx) {
        connection.console.log(`🐼 Found panda context! ✅ at ${ctx.path}`)
      }
    })

    return { capabilities }
  })

  connection.onDidChangeWatchedFiles(async (_change) => {
    await loadPandaContext()
    connection.console.log('🔃 Reloading panda context...')
  })

  documents.listen(connection)
  connection.listen()

  return {
    loadPandaContext,
    getContext() {
      return ref.context
    },
    isSynchronizing() {
      return ref.synchronizing
    },
  }
}

export type PandaExtensionSetup = ReturnType<typeof setupBuilder>
