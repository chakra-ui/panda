import { commands, ExtensionContext, window } from 'vscode';
import { SidebarProvider } from './sidebar-provider';

export function activate(context: ExtensionContext) {
  // Register the Sidebar Panel
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(window.registerWebviewViewProvider('pandacss-sidebar', sidebarProvider));

  context.subscriptions.push(
    commands.registerCommand('pandacss.sayhello', () => {
      window.showInformationMessage('Hello World!');
    })
  );

  context.subscriptions.push(
    commands.registerCommand('pandacss.askquestion', async () => {
      let response = await window.showInformationMessage('How are you doing?', 'Good', 'Bad');
      if (response === 'Bad') {
        window.showInformationMessage("I'm sorry");
      }
    })
  );
}
