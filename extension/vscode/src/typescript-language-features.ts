import * as vscode from 'vscode'

interface TsLanguageFeatures {
  getAPI(version: 0): TsLanguageFeaturesApiV0 | undefined
}

export interface TsLanguageFeaturesApiV0 {
  configurePlugin(pluginId: string, configuration: Record<string, any>): void
  onCompletionAccepted(
    cb: (item: vscode.CompletionItem & { document: vscode.TextDocument; tsEntry: any }) => void | Promise<void>,
  ): void
}

export async function getTsApi() {
  // Get the TS extension
  const tsExtension = vscode.extensions.getExtension<TsLanguageFeatures>('vscode.typescript-language-features')
  if (!tsExtension) {
    return
  }

  await tsExtension.activate()

  // Get the API from the TS extension
  if (!tsExtension.exports || !tsExtension.exports.getAPI) {
    return
  }

  return tsExtension.exports.getAPI(0)
}
