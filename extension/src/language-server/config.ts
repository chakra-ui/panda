import {
  Connection,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import PinceauTokensManager, { PinceauVSCodeSettings, defaultSettings } from './manager'
import { uriToPath } from './utils/protocol'

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<PinceauVSCodeSettings>> = new Map()

// Context ; exposed via return of `setupExtension()`
let debug = false
let rootPath: string
let globalSettings = defaultSettings
let hasConfigurationCapability = false
let hasWorkspaceFolderCapability = false

/**
 * Setup extension
 * - Config detection & loading
 * - Configuration capabilities
 */
export function setupExtension(
  connection: Connection,
  tokensManager: PinceauTokensManager,
  documents: TextDocuments<TextDocument>,
) {
  /**
   * Resolve current extension settings
   */
  function getDocumentSettings(): Thenable<PinceauVSCodeSettings> {
    const resource = 'all'
    if (!hasConfigurationCapability) {
      return Promise.resolve(globalSettings)
    }
    let result = documentSettings.get(resource)
    if (!result) {
      result = connection.workspace.getConfiguration('pinceau')
      documentSettings.set(resource, result)
    }
    return result
  }

  connection.onInitialize((params: InitializeParams) => {
    connection.console.log('🖌️ Booting Pinceau extension...')

    const capabilities = params.capabilities

    // Check context support
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration)
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders)

    connection.onInitialized(async () => {
      if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined)
      }
      if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders((_event) =>
          connection.console.log('Workspace folder change event received.'),
        )
      }

      const workspaceFolders = await connection.workspace.getWorkspaceFolders()
      const validFolders = workspaceFolders?.map((folder) => uriToPath(folder.uri) || '').filter((path) => !!path)

      rootPath = validFolders?.[0]

      const settings = await getDocumentSettings()

      debug = settings?.debug || false

      await tokensManager.syncTokens(validFolders || [], settings)

      connection.console.log('🖌️ Booted Pinceau extension!')
    })

    const result: InitializeResult = {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,

        // Tell the client that this server supports code completion.
        completionProvider: {
          resolveProvider: true,
        },
        definitionProvider: true,
        hoverProvider: true,
        colorProvider: true,
        inlineValueProvider: true,
      },
    }

    if (hasWorkspaceFolderCapability) {
      result.capabilities.workspace = {
        workspaceFolders: {
          supported: true,
          changeNotifications: true,
        },
      }
    }

    return result
  })

  connection.onDidChangeConfiguration(async (change) => {
    debug && connection.console.log('⌛ onDidChangeConfiguration')

    if (hasConfigurationCapability) {
      // Reset all cached document settings
      documentSettings.clear()
      tokensManager.clearAllCache()

      const validFolders = await connection.workspace
        .getWorkspaceFolders()
        .then((folders) => folders?.map((folder) => uriToPath(folder.uri) || '').filter((path) => !!path))

      const settings = await getDocumentSettings()

      await tokensManager.syncTokens(validFolders || [], settings)
    } else {
      globalSettings = <PinceauVSCodeSettings>(change.settings?.pinceau || defaultSettings)
    }
  })

  connection.onDidChangeWatchedFiles(async (_change) => {
    const settings = await getDocumentSettings()

    tokensManager.clearAllCache()

    const validFolders = await connection.workspace
      .getWorkspaceFolders()
      .then((folders) => folders?.map((folder) => uriToPath(folder.uri) || '').filter((path) => !!path))

    await tokensManager.syncTokens(validFolders || [], settings)
  })

  // Only keep settings for open documents
  documents.onDidClose((e) => documentSettings.delete(e.document.uri))

  documents.listen(connection)

  connection.listen()

  return {
    getDocumentSettings,
    get documentSettings() {
      return documentSettings
    },
    get rootPath() {
      return rootPath
    },
    get debug() {
      return debug
    },
    get globalSettings() {
      return globalSettings
    },
    get hasConfigurationCapability() {
      return hasConfigurationCapability
    },
    get hasWorkspaceFolderCapability() {
      return hasWorkspaceFolderCapability
    },
  }
}
