import { join } from 'node:path'
import ts from 'typescript'
import { beforeAll, describe, expect, it } from 'vitest'
import { createProjectFromConfig, type Project } from '@pandacss/compiler/tooling'
import { createPluginModuleFactory } from '../src/plugin'

const PROJECT_DIR = join(import.meta.dirname, 'fixtures/sample-project')
const CONFIG_FILE = join(PROJECT_DIR, 'panda.config.ts')

// A minimal stand-in for tsserver's own LanguageServiceHost — just enough for
// ts.createLanguageService to parse the one file the "user" has open.
function createEditorHost(fileName: string, currentText: string): ts.LanguageServiceHost {
  return {
    getScriptFileNames: () => [fileName],
    getScriptVersion: () => '1',
    getScriptSnapshot: (name) => (name === fileName ? ts.ScriptSnapshot.fromString(currentText) : undefined),
    getCurrentDirectory: () => PROJECT_DIR,
    getCompilationSettings: () => ({ target: ts.ScriptTarget.Latest, module: ts.ModuleKind.ESNext }),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: (name) => name === fileName || ts.sys.fileExists(name),
    readFile: (name) => (name === fileName ? currentText : ts.sys.readFile(name)),
  }
}

describe('a user editing panda.config.ts with the plugin installed in their editor', () => {
  let project: Project

  beforeAll(async () => {
    project = await createProjectFromConfig({ cwd: PROJECT_DIR })
  })

  it("sees Panda's suggestions alongside TypeScript's own, without losing either", async () => {
    const unsavedText = `
      import { defineConfig, defineGlobalStyles } from '@pandacss/dev'
      export default defineConfig({
        globalCss: defineGlobalStyles({ html: { color: 're' } }),
      })
    `
    const host = createEditorHost(CONFIG_FILE, unsavedText)
    const languageService = ts.createLanguageService(host)

    const factory = createPluginModuleFactory(async () => project)
    const pluginLanguageService = factory({ typescript: ts }).create({
      project: { getCurrentDirectory: () => PROJECT_DIR } as unknown as ts.server.Project,
      languageService,
      languageServiceHost: host,
      serverHost: {} as ts.server.ServerHost,
      config: {},
    })

    // Give the plugin's background project load a turn to finish before asking
    // for completions — the same load a real tsserver session waits through.
    await Promise.resolve()
    await Promise.resolve()

    const position = unsavedText.indexOf("'re'") + 3
    const tsOwnSuggestions = languageService.getCompletionsAtPosition(CONFIG_FILE, position, {})
    const suggestionsWithPanda = pluginLanguageService.getCompletionsAtPosition(CONFIG_FILE, position, {})

    expect(suggestionsWithPanda?.entries.some((entry) => entry.name === 'red.500')).toBe(true)
    expect(suggestionsWithPanda?.entries.length).toBeGreaterThanOrEqual(tsOwnSuggestions?.entries.length ?? 0)
  })

  it("doesn't interfere with normal TypeScript features like finding the open file in the program", () => {
    const host = createEditorHost(CONFIG_FILE, 'export default {}')
    const languageService = ts.createLanguageService(host)
    const factory = createPluginModuleFactory(async () => project)
    const pluginLanguageService = factory({ typescript: ts }).create({
      project: { getCurrentDirectory: () => PROJECT_DIR } as unknown as ts.server.Project,
      languageService,
      languageServiceHost: host,
      serverHost: {} as ts.server.ServerHost,
      config: {},
    })

    expect(
      pluginLanguageService
        .getProgram()
        ?.getSourceFiles()
        .some((file) => file.fileName === CONFIG_FILE),
    ).toBe(true)
  })
})
