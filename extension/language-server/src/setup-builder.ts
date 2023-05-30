import { Builder } from '@pandacss/node'
import { Connection, DidChangeConfigurationNotification, InitializeParams, TextDocuments } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { serverCapabilities } from './capabilities'
import { PandaVSCodeSettings, defaultSettings } from './settings'
import { walkObject } from '@pandacss/shared'

const ref = {
  context: null as unknown as Builder['context'],
  synchronizing: false as Promise<void> | false,
  settings: null as PandaVSCodeSettings | null,
}

let hasConfigurationCapability = false

/**
 * Setup builder
 * - panda.config detection & context loading
 * - reload on panda.config change
 * - make the builder.setup promise shared so it can be awaited by multiple features
 */
export function setupBuilder(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
  onDidChangeConfiguration: (settings: PandaVSCodeSettings) => void,
) {
  const builder = new Builder()

  /**
   * Resolve current panda context
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

  const getFreshPandaSettings = async () => {
    return flatten((await connection.workspace.getConfiguration('panda')) ?? defaultSettings)
  }

  /**
   * Resolve current extension settings
   */
  async function getPandaSettings(): Promise<PandaVSCodeSettings>
  async function getPandaSettings<Key extends keyof PandaVSCodeSettings>(key: Key): Promise<PandaVSCodeSettings[Key]>
  async function getPandaSettings<Key extends keyof PandaVSCodeSettings>(key?: Key) {
    const getter = (settings: PandaVSCodeSettings) => {
      return key ? settings[key] : settings
    }

    if (!hasConfigurationCapability) {
      return getter(defaultSettings)
    }

    if (!ref.settings) {
      ref.settings = await getFreshPandaSettings()
    }

    return getter(ref.settings ?? defaultSettings)
  }

  connection.onInitialize((params: InitializeParams) => {
    connection.console.log('🤖 Starting PandaCss LSP...')

    const capabilities = params.capabilities

    // Check context support
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration)

    connection.onInitialized(async () => {
      const ctx = await loadPandaContext()

      connection.console.log('⚡ Connection initialized!')

      if (ctx) {
        connection.console.log(`🐼 Found panda context! ✅ at ${ctx.path}`)
      }

      if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined)
      }
    })

    return { capabilities: serverCapabilities }
  })

  connection.onDidChangeConfiguration(async (_change) => {
    connection.console.log('⌛ onDidChangeConfiguration')

    if (hasConfigurationCapability) {
      ref.settings = await getFreshPandaSettings()
      console.log('🐼 Settings changed!', ref.settings)
      onDidChangeConfiguration(ref.settings)
    }
  })

  connection.onDidChangeWatchedFiles(async (_change) => {
    await loadPandaContext()
    connection.console.log('🔃 Reloading panda context...')
  })

  documents.listen(connection)
  connection.listen()

  return {
    getPandaSettings,
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

function flatten(values: Record<string, Record<string, any>>) {
  const result: Record<string, any> = {}

  walkObject(values, (token, paths) => {
    result[paths.join('.')] = token
  })

  return result
}
