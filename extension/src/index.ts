import * as path from 'path'
import vscode, { CompletionList, commands } from 'vscode'
import {
  CloseAction,
  ErrorAction,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'

let client: LanguageClient
let updateTextTimeout: NodeJS.Timeout | undefined

const docSelector: vscode.DocumentSelector = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact']
// https://github.com/microsoft/vscode/issues/128036#issuecomment-876202882
// customizable/extendable CompletionItem

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

  let isInternalCompletion = false

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: docSelector as string[],
    diagnosticCollectionName: 'panda',
    // synchronize: {
    //   fileEvents: [vscode.workspace.createFileSystemWatcher('**/*/panda.config.ts')],
    // },
    // errorHandler: {
    //   error(error, message, count) {
    //     console.error(error, message, count)
    //     return { action: ErrorAction.Continue }
    //   },
    //   closed() {
    //     return { action: CloseAction.DoNotRestart }
    //   },
    // },
    middleware: {
      async provideCompletionItem(doc, position, context, cancel, next) {
        if (isInternalCompletion) return next(doc, position, context, cancel)
        console.log('provideCompletionItem', context)
        // return next(item, token)

        isInternalCompletion = true
        const list = await commands.executeCommand<CompletionList>(
          'vscode.executeCompletionItemProvider',
          doc.uri,
          position,
          context.triggerCharacter,
        )
        const oui = list.items.find((item) => item.label === 'blue.100')
        if (oui) {
          oui.detail = '🐼 yesyes'
          oui.documentation = "la doc de l'item blue.100"
          console.log(oui)
        }

        isInternalCompletion = false

        console.log(list)

        return list
      },
      resolveCompletionItem(item, token, next) {
        console.log('resolveCompletionItem', item, token)
        // return next(item, token)
        return item
      },
    },
  }

  // Create the language client and start the client.
  client = new LanguageClient('panda', 'Panda IntelliSense', serverOptions, clientOptions)

  console.log('before start')

  const disposable = vscode.commands.registerCommand('panda-css-extension.restart', async () => {
    updateTextTimeout && clearTimeout(updateTextTimeout)

    loadingStatusBarItem.text = '🐼 Restarting...'
    loadingStatusBarItem.show()

    console.log('restarting...')
    await client.restart()

    // Show and focus the output channel
    client.outputChannel.show(true)
    loadingStatusBarItem.hide()
    console.log('restarted !')
  })

  context.subscriptions.push(disposable)

  // Register the 'onCompletion' event
  // const completionProvider = vscode.languages.registerCompletionItemProvider(
  //   { language: 'typescript' },
  //   {
  //     provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
  //       // Get the default completion items from TypeScript
  //       // const defaultItems = vscode.languages
  //       //   .getLanguages()
  //       //   .find((language) => language.id === 'typescript')
  //       //   ?.completionItemProvider!.provideCompletionItems(document, position);

  //       // if (defaultItems) {
  //       //   // Modify the default completion items or create new ones with additional details
  //       //   const modifiedItems = defaultItems.map((item) => {
  //       //     // Create a new CompletionItem with additional details
  //       //     const modifiedItem = new vscode.CompletionItem(item.label);
  //       //     modifiedItem.kind = item.kind;
  //       //     modifiedItem.detail = 'Additional detail information';

  //       //     return modifiedItem;
  //       //   });

  //       //   return modifiedItems;
  //       // }

  //       return [];
  //     },
  //   }
  // );

  // console.log(vscode.extensions.getExtension('vscode.typescript-language-features'))
  // console.log((await vscode.commands.getCommands()).filter((command) => command.includes('Completion')))

  // https://github.com/microsoft/vscode/blob/7d572968ffc496213defe770b6597db97fce8b24/src/vs/workbench/api/common/extHostApiCommands.ts#L240
  // https://github.com/microsoft/vscode/blob/7d572968ffc496213defe770b6597db97fce8b24/src/vs/editor/contrib/suggest/browser/suggest.ts#L383
  // console.log(
  //   await vscode.commands.executeCommand(
  //     'vscode.executeCompletionItemProvider',
  //     vscode.window.activeTextEditor?.document.uri,
  //     new vscode.Position(0, 0),
  //     '',
  //   ),
  // )

  // new vscode.CompletionItem('test', vscode.CompletionItemKind.Text)
  // https://github.com/microsoft/vscode/blob/7d572968ffc496213defe770b6597db97fce8b24/extensions/typescript-language-features/src/api.ts
  const tsExtension = vscode.extensions.getExtension('vscode.typescript-language-features')
  const languageFeatures = await tsExtension?.activate()
  console.log(languageFeatures)
  const api = languageFeatures.getAPI(0)
  console.log(Object.keys(api))
  console.log(api, Array.from(api.a.configurations()))

  // vscode.languages.registerInlineCompletionItemProvider(docSelector, {
  //   provideInlineCompletionItems(document, position, context, token) {
  //     console.log('provideInlineCompletionItems', document, position, context, token)
  //     return [
  //       {
  //         text: 'ayayaya',
  //         range: new vscode.Range(position, position),
  //         insertText: 'ayayaya',
  //         filterText: 'ayayaya',
  //       },
  //     ]
  //   },
  // })

  // const configurePluginCommand = '_typescript.configurePlugin'
  // https://github.com/microsoft/vscode/blob/2eb365c80d57491f40b700a8a09771bf707c27d3/extensions/typescript-language-features/src/commands/configurePlugin.ts#L10

  // console.log(client.getFeature('textDocument/completion'))

  try {
    // Start the client. This will also launch the server
    loadingStatusBarItem.text = '🐼 Starting...'

    await client.start()
    console.log('starting...')
    loadingStatusBarItem.text = '🐼 Ready !'

    updateTextTimeout = setTimeout(() => {
      loadingStatusBarItem.hide()
    }, 2000)
  } catch (err) {
    updateTextTimeout && clearTimeout(updateTextTimeout)
    console.log('error', err)
  }
}

export function deactivate(): Thenable<void> | undefined {
  console.log('deactivate')

  updateTextTimeout && clearTimeout(updateTextTimeout)

  if (!client) {
    return undefined
  }

  console.log('stoppping...')
  return client.stop()
}
