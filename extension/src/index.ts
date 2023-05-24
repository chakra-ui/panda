import * as path from 'path'
import vscode from 'vscode'
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'

const docSelector: vscode.DocumentSelector = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact']

let client: LanguageClient

export async function activate(context: vscode.ExtensionContext) {
  console.log('activate')

  const loadingStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
  loadingStatusBarItem.text = '🐼 Loading...'
  loadingStatusBarItem.show()

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(path.join('out', 'server.js'))

  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6099'] }

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
    // synchronize: {
    //   fileEvents: [vscode.workspace.createFileSystemWatcher('**/*/panda.config.ts')],
    // },
  }

  // Create the language client and start the client.
  client = new LanguageClient('panda', 'Panda IntelliSense', serverOptions, clientOptions)

  console.log('before start')

  const restartCmd = vscode.commands.registerCommand('panda-css-extension.restart', async () => {
    loadingStatusBarItem.text = '🐼 Restarting...'
    loadingStatusBarItem.show()

    console.log('restarting...')
    await client.restart()

    // Show and focus the output channel
    client.outputChannel.show(true)
    loadingStatusBarItem.hide()
    console.log('restarted !')
  })

  context.subscriptions.push(restartCmd)

  try {
    // Start the client. This will also launch the server
    loadingStatusBarItem.text = '🐼 Starting...'

    await client.start()
    console.log('starting...')
    loadingStatusBarItem.hide()
  } catch (err) {
    console.log('error', err)
  }
}

export function deactivate(): Thenable<void> | undefined {
  console.log('deactivate')

  if (!client) {
    return undefined
  }

  console.log('stoppping...')
  return client.stop()
}
