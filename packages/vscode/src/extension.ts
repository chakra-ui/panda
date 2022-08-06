import { commands, ConfigurationTarget, ExtensionContext, window, workspace } from 'vscode'
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
      let response = await window.showInformationMessage('How are you doing?', 'Good', 'Bad')
      if (response === 'Bad') {
        window.showInformationMessage("I'm sorry")
      }
    }),
  )

  const CSS_PANDA_PATH = './.panda/design-tokens/index.css'
  const cssvars = workspace.getConfiguration('cssvar', workspace?.workspaceFolders?.[0]?.uri)
  const cssvarsFiles = cssvars.get('files') as any[]
  if (!cssvarsFiles) {
    cssvars.update('files', [CSS_PANDA_PATH], ConfigurationTarget.Global)
  } else if (!cssvarsFiles.includes(CSS_PANDA_PATH)) {
    cssvars.update('files', [...cssvarsFiles, CSS_PANDA_PATH], ConfigurationTarget.Global)
  }
}
