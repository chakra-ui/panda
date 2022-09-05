import { commands, ConfigurationTarget, ExtensionContext, window, workspace } from 'vscode'
import { loadConfigFile } from '@css-panda/read-config'
import { SidebarProvider } from './sidebar-provider'

export function activate(context: ExtensionContext) {
  // Register the Sidebar Panel
  const sidebarProvider = new SidebarProvider(context.extensionUri)
  context.subscriptions.push(window.registerWebviewViewProvider('pandacss-sidebar', sidebarProvider))

  context.subscriptions.push(
    commands.registerCommand('pandacss.sayhello', () => {
      window.showInformationMessage('Hello World!')
    }),
  )

  context.subscriptions.push(
    commands.registerCommand('pandacss.askquestion', async () => {
      const response = await window.showInformationMessage('How are you doing?', 'Good', 'Bad')
      if (response === 'Bad') {
        window.showInformationMessage("I'm sorry")
      }
    }),
  )

  const filepath = workspace.workspaceFolders?.[0]?.uri?.fsPath

  if (!filepath) return

  const config = loadConfigFile({ root: filepath })

  config.then(({ config }) => {
    if (!config) {
      window.showErrorMessage('Panda config not found in workspace root.')
    } else {
      const pandaCSSVariablesPath = config.vscCssPath ?? './.panda/design-tokens/index.css'
      const cssvars = workspace.getConfiguration('cssvar', workspace?.workspaceFolders?.[0]?.uri)
      const cssvarsFiles = cssvars.get('files') as any[]
      if (!cssvarsFiles) {
        cssvars.update('files', [pandaCSSVariablesPath], ConfigurationTarget.Global)
      } else if (!cssvarsFiles.includes(pandaCSSVariablesPath)) {
        cssvars.update('files', [...cssvarsFiles, pandaCSSVariablesPath], ConfigurationTarget.Global)
      }
    }
  })
}
