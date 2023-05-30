import vscode from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'

export const registerClientCommands = ({
  context,
  client,
  debug,
  loadingStatusBarItem,
}: {
  context: vscode.ExtensionContext
  debug: boolean
  client: LanguageClient
  loadingStatusBarItem: vscode.StatusBarItem
}) => {
  const restartCmd = vscode.commands.registerCommand('panda-css-vscode.restart', async () => {
    loadingStatusBarItem.text = '🐼 Restarting...'
    loadingStatusBarItem.show()

    debug && console.log('restarting...')
    await client.restart()

    client.outputChannel.show(true)
    loadingStatusBarItem.hide()
    debug && console.log('restarted !')
  })

  context.subscriptions.push(restartCmd)

  const showOutputCmd = vscode.commands.registerCommand('panda-css-vscode.show-output', async () => {
    // Show and focus the output channel
    client.outputChannel.show(true)
  })

  context.subscriptions.push(showOutputCmd)
}
