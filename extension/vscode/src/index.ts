import * as path from 'path'
import { CancellationToken, TextEditorDecorationType } from 'vscode'
import * as vscode from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  MessageSignature,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'
import { registerClientCommands } from './commands'
import { defaultSettings, getFlattenedSettings } from 'panda-css-extension-shared'
import type ProtocolCompletionItem from 'vscode-languageclient/lib/common/protocolCompletionItem'
import { TsLanguageFeaturesApiV0, getTsApi } from './typescript-language-features'

// Client entrypoint
const docSelector: vscode.DocumentSelector = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact']

let client: LanguageClient
const debug = true

export async function activate(context: vscode.ExtensionContext) {
  debug && console.log('activate')

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
  statusBarItem.text = '🐼 Loading...'
  statusBarItem.show()
  statusBarItem.command = 'panda-css-vscode.open-config'

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'))

  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = debug ? { execArgv: ['--nolazy', '--inspect=6099'] } : {}

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  }
  const activeDocument = vscode.window.activeTextEditor?.document
  let tsApi: TsLanguageFeaturesApiV0 | undefined

  let colorDecorationType: TextEditorDecorationType | undefined
  const clearColors = () => {
    if (colorDecorationType) {
      colorDecorationType.dispose()
      colorDecorationType = undefined
    }
  }
  context.subscriptions.push({ dispose: clearColors })

  const getFreshPandaSettings = () =>
    getFlattenedSettings((vscode.workspace.getConfiguration('panda') as any) ?? defaultSettings)

  // Options to control the language client
  let activeDocumentFilepath = activeDocument?.uri.fsPath
  const clientOptions: LanguageClientOptions = {
    documentSelector: docSelector as string[],
    diagnosticCollectionName: 'panda',
    synchronize: {
      fileEvents: [vscode.workspace.createFileSystemWatcher('**/*/panda.config.{ts,js,cjs,mjs}')],
    },
    initializationOptions: () => {
      return {
        activeDocumentFilepath: activeDocument?.uri.fsPath,
      }
    },
    middleware: {
      async provideDocumentColors(document, token, next) {
        const settings = getFreshPandaSettings()
        if (!settings['color-hints.enabled']) return
        if (settings['color-hints.color-preview.enabled']) return next(document, token)

        if (!colorDecorationType) {
          colorDecorationType = vscode.window.createTextEditorDecorationType({
            before: {
              width: '0.8em',
              height: '0.8em',
              contentText: ' ',
              border: '0.1em solid',
              margin: '0.1em 0.2em 0',
            },
            dark: {
              before: {
                borderColor: '#eeeeee',
              },
            },
            light: {
              before: {
                borderColor: '#000000',
              },
            },
          })
        }

        const colors = (await next(document, token)) ?? []
        vscode.window.visibleTextEditors
          .find((editor) => editor.document === document)
          ?.setDecorations(
            colorDecorationType,
            colors.map(({ range, color }) => ({
              range,
              renderOptions: {
                before: {
                  backgroundColor: `rgba(${color.red * 255}, ${color.green * 255}, ${color.blue * 255}, ${
                    color.alpha
                  })`,
                },
              },
            })),
          )

        return []
      },
    },
  }

  // Create the language client and start the client.
  client = new LanguageClient('panda', 'Panda IntelliSense', serverOptions, clientOptions)
  client.outputChannel.appendLine('Starting PandaCss client extension...')

  // global error handler
  client.handleFailedRequest = (
    type: MessageSignature,
    token: CancellationToken | undefined,
    error: any,
    defaultValue: any,
    showNotification?: boolean,
  ) => {
    console.log('handleFailedRequest', { type, token, error, defaultValue, showNotification })
    return defaultValue
  }
  client.onNotification('$/clear-colors', clearColors)

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) return
      if (!client.isRunning()) return
      if (editor.document.uri.scheme !== 'file') return

      activeDocumentFilepath = editor.document.uri.fsPath
      client.sendNotification('$/active-document-changed', { activeDocumentFilepath })
    }),
  )

  context.subscriptions.push(
    client.onNotification('$/doc-config-path', (notif: { activeDocumentFilepath: string; configPath: string }) => {
      tsApi.configurePlugin('panda-css-ts-plugin', { type: 'active-doc', data: notif })
    }),
  )

  context.subscriptions.push(
    client.onNotification('$/panda-token-names', (notif: { configPath: string; tokenNames: string[] }) => {
      tsApi.configurePlugin('panda-css-ts-plugin', { type: 'setup', data: notif })
    }),
  )

  debug && console.log('before start')

  registerClientCommands({ context, debug, client, loadingStatusBarItem: statusBarItem })

  try {
    tsApi = await getTsApi()
  } catch (err) {
    debug && console.log('error loading TS', err)
  }

  try {
    // Start the client. This will also launch the server
    statusBarItem.text = '🐼 Starting...'

    await client.start()
    debug && console.log('starting...')
    statusBarItem.text = '🐼'
    statusBarItem.tooltip = 'Open current panda config'
  } catch (err) {
    debug && console.log('error starting client', err)
  }
}

export function deactivate(): Thenable<void> | undefined {
  debug && console.log('deactivate')

  if (!client) {
    return undefined
  }

  debug && console.log('stoppping...')
  return client.stop()
}
