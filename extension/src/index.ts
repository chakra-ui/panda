import * as path from 'path'
import vscode from 'vscode'
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'

let client: LanguageClient

export async function activate(context: vscode.ExtensionContext) {
  console.log('activate')
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(path.join('out', 'server.js'))
  console.log({ serverModule })

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
    documentSelector: [
      'onLanguage:astro',
      'onLanguage:svelte',
      'onLanguage:vue',
      'onLanguage:vue-html',
      'onLanguage:vue-postcss',
      'onLanguage:scss',
      'onLanguage:postcss',
      'onLanguage:less',
      'onLanguage:css',
      'onLanguage:html',
      'onLanguage:javascript',
      'onLanguage:javascriptreact',
      'onLanguage:typescript',
      'onLanguage:typescriptreact',
      'onLanguage:source.css.styled',
    ].map((event) => ({
      scheme: 'file',
      language: event.split(':')[1],
    })),
    diagnosticCollectionName: 'panda',
    // synchronize: {
    //   fileEvents: [vscode.workspace.createFileSystemWatcher('**/*/panda.config.ts')],
    // },
  }

  // Create the language client and start the client.
  client = new LanguageClient('panda', 'Panda IntelliSense', serverOptions, clientOptions)

  console.log('before start')

  try {
    // Start the client. This will also launch the server
    await client.start()
    console.log('starting...')
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
