import * as vscode from "vscode";
import { getUri } from "./utilities/get-uri";
import { requireModule } from "./utilities/require-config";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Listen for messages from the Sidebar component and execute action
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, this._extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.css",
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, this._extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.js",
    ]);

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspaceUri = workspaceFolder?.uri;
    const configPath = vscode.Uri.joinPath(
      workspaceUri!,
      "panda.config.ts"
    ).fsPath;
    let config;

    try {
      config = requireModule(configPath);
    } catch (error) {}

    if (!config) return "panda.config.ts not found";

    if (workspaceFolder) {
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceFolder, "panda.config.ts")
      );
      watcher.onDidChange((uri) => {
        const newConfig = requireModule(uri.path);
        this._view?.webview.postMessage({
          type: "onConfigChange",
          value: newConfig,
        });
      });
    }

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
     <!DOCTYPE html>
     <html lang="en">
       <head>
         <meta charset="UTF-8" />
         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
         <link rel="stylesheet" type="text/css" href="${stylesUri}">
         <title>Hello World</title>
       </head>
       <body>
        <div id="root"></div>
        <script>
          window.config = ${JSON.stringify(config)}
        </script>
        <script type="module" src="${scriptUri}"></script>
       </body>
     </html>
   `;
  }
}
