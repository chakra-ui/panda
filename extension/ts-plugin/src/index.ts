import type ts from 'typescript/lib/tsserverlibrary'

/**
 * @see https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#decorator-creation
 */
function init(_modules: { typescript: typeof import('typescript/lib/tsserverlibrary') }) {
  // const ts = modules.typescript

  // Get a list of things to remove from the completion list from the config object.
  let completionItemsToRemove: string[] = []

  function create(info: ts.server.PluginCreateInfo) {
    // Diagnostic logging
    info.project.projectService.logger.info('[panda-css-ts-plugin] init.create ok')

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
      prior.entries = prior.entries.filter((e) => completionItemsToRemove.indexOf(e.name) < 0)

      // Sample logging for diagnostic purposes
      if (oldLength !== prior.entries.length) {
        const entriesRemoved = oldLength - prior.entries.length
        info.project.projectService.logger.info(
          `[panda-css-ts-plugin] Removed ${entriesRemoved} entries from the completion list`,
        )
      }

      return prior
    }

    return proxy
  }

  // https://code.visualstudio.com/api/references/contribution-points#contributes.typescriptServerPlugins
  function onConfigurationChanged(config: any) {
    completionItemsToRemove = config.completionItems ?? []
    console.info(`[panda-css-ts-plugin] onConfigurationChanged`, completionItemsToRemove?.length ?? 0)
  }

  return { create, onConfigurationChanged }
}

// https://code.visualstudio.com/api/references/vscode-api#extensions
export = init
