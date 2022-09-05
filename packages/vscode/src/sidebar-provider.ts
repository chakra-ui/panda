import * as vscode from 'vscode'
import { getUri } from './utilities/get-uri'
import { loadConfigFile } from '@css-panda/read-config'

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView
  _doc?: vscode.TextDocument

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public sendConfig(_view?: vscode.WebviewView) {
    const view = _view || this._view
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
    const workspaceUri = workspaceFolder?.uri

    const filepath = workspaceUri?.fsPath

    if (!filepath) return

    const conf = loadConfigFile({ root: filepath })

    conf.then(({ config }) => {
      view?.webview.postMessage({
        type: 'onConfigChange',
        value: config,
      })
    })
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

    // Listen for messages from the Sidebar component and execute action
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'reload': {
          webviewView.webview.html = 'reload'
          webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)
          break
        }
        case 'fetchConfig': {
          this.sendConfig()
          break
        }
        case 'onInfo': {
          if (!data.value) {
            return
          }
          vscode.window.showInformationMessage(data.value)
          break
        }
        case 'onError': {
          if (!data.value) {
            return
          }
          vscode.window.showErrorMessage(data.value)
          break
        }
      }
    })
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, this._extensionUri, ['webview-ui', 'build', 'assets', 'index.css'])
    // The JS file from the React build output
    const scriptUri = getUri(webview, this._extensionUri, ['webview-ui', 'build', 'assets', 'index.js'])

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
    const workspaceUri = workspaceFolder?.uri
    const filepath = workspaceUri?.fsPath

    if (filepath && workspaceFolder) {
      const conf = loadConfigFile({ root: filepath })
      conf.then(({ path }) => {
        if (path) {
          const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolder, path))
          watcher.onDidChange(() => this.sendConfig(this._view))
        }
      })
    }

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
     <!DOCTYPE html>
     <html lang="en">
       <head>
         <meta charset="UTF-8" />
         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
         <link rel="stylesheet" type="text/css" href="${stylesUri}">
         <title>Panda CSS</title>
       </head>
       <body>
        <div id="root"></div>
      
        <script type="module" src="${scriptUri}"></script>
       </body>
     </html>
   `
  }
}
