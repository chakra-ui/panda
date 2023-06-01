import * as path from 'path'
import vscode, { CancellationToken } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  MessageSignature,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'
import { registerClientCommands } from './commands'

// Client entrypoint
const docSelector: vscode.DocumentSelector = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact']

let client: LanguageClient
const debug = false

export async function activate(context: vscode.ExtensionContext) {
  debug && console.log('activate')

  const loadingStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
  loadingStatusBarItem.text = '🐼 Loading...'
  loadingStatusBarItem.show()

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

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: docSelector as string[],
    diagnosticCollectionName: 'panda',
    synchronize: {
      fileEvents: [vscode.workspace.createFileSystemWatcher('**/*/panda.config.ts')],
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

  debug && console.log('before start')

  registerClientCommands({ context, debug, client, loadingStatusBarItem })

  try {
    // Start the client. This will also launch the server
    loadingStatusBarItem.text = '🐼 Starting...'

    await client.start()
    debug && console.log('starting...')
    loadingStatusBarItem.hide()
  } catch (err) {
    debug && console.log('error', err)
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
