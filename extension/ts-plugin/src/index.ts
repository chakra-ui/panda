import type ts from 'typescript/lib/tsserverlibrary'
import { type PandaVSCodeSettings } from '@pandacss/extension-shared'

const { defaultSettings } = require('@pandacss/extension-shared')

/**
 * @see https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#decorator-creation
 */
function init(_modules: { typescript: typeof import('typescript/lib/tsserverlibrary') }) {
  // const ts = modules.typescript

  // Get a list of things to remove from the completion list from the config object.

  function create(info: ts.server.PluginCreateInfo) {
    // Diagnostic logging
    info.project.projectService.logger.info('[@pandacss/ts-plugin] init.create ok')

    // Set up decorator object
    const proxy: ts.LanguageService = Object.create(null)
    for (const k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
      const x = info.languageService[k]!
      // @ts-expect-error - JS runtime trickery which is tricky to type tersely
      proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args)
    }

    // Remove specified entries from completion list
    proxy.getCompletionsAtPosition = (fileName, position, options) => {
      const prior = info.languageService.getCompletionsAtPosition(fileName, position, options)
      if (!prior) return

      const oldLength = prior.entries.length
      const configPath = configPathByDocFilepath.get(fileName)
      if (!configPath) return prior

      const tokenNames = tokenNamesByConfigPath.get(configPath)
      if (!tokenNames) return prior

      if (!settings['completions.enabled']) return prior

      prior.entries = prior.entries.filter((e) => tokenNames.indexOf(e.name) < 0)

      // Sample logging for diagnostic purposes
      if (oldLength !== prior.entries.length) {
        const entriesRemoved = oldLength - prior.entries.length
        info.project.projectService.logger.info(
          `[@pandacss/ts-plugin] Removed ${entriesRemoved} entries from the completion list`,
        )
      }

      return prior
    }

    return proxy
  }

  const tokenNamesByConfigPath = new Map<string, string[]>()
  const configPathByDocFilepath = new Map<string, string>()
  let settings = defaultSettings as PandaVSCodeSettings

  // https://code.visualstudio.com/api/references/contribution-points#contributes.typescriptServerPlugins
  function onConfigurationChanged(event: ConfigEvent) {
    if (event.type === 'setup') {
      const { configPath, tokenNames } = event.data
      tokenNamesByConfigPath.set(configPath, tokenNames)
    }

    if (event.type === 'active-doc') {
      const { activeDocumentFilepath, configPath } = event.data
      configPathByDocFilepath.set(activeDocumentFilepath, configPath)
    }

    if (event.type === 'update-settings') {
      settings = event.data
    }
  }

  return { create, onConfigurationChanged }
}

// https://code.visualstudio.com/api/references/vscode-api#extensions
export = init

type ConfigEvent =
  | { type: 'setup'; data: { configPath: string; tokenNames: string[] } }
  | { type: 'active-doc'; data: { activeDocumentFilepath: string; configPath: string } }
  | { type: 'update-settings'; data: PandaVSCodeSettings }
