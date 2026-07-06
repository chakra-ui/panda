import { join } from 'node:path'
import ts from 'typescript'
import { beforeAll, describe, expect, it } from 'vitest'
import { createCompiler } from '@pandacss/compiler'
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

  it('sees a newly added token without restarting, once the project reloads underneath it', async () => {
    const buildProject = (tokenName: string): Project => ({
      compiler: createCompiler({
        cwd: PROJECT_DIR,
        outdir: 'styled-system',
        theme: { tokens: { colors: { [tokenName]: { 500: { value: '#000' } } } } },
        utilities: { color: { className: 'c', values: 'colors' } },
      }),
      configPath: CONFIG_FILE,
      dependencies: [],
      outdir: 'styled-system',
      designSystemDiagnostics: [],
    })

    // Every completion request calls loadProject again — a real ProjectRegistry only does real
    // work once its file-watcher invalidates a stale entry, but the plugin itself shouldn't be
    // the thing pinning a stale project in place.
    let project = buildProject('red')
    const factory = createPluginModuleFactory(async () => project)

    const text = `
      import { defineConfig, defineGlobalStyles } from '@pandacss/dev'
      export default defineConfig({
        globalCss: defineGlobalStyles({ html: { color: '' } }),
      })
    `
    const host = createEditorHost(CONFIG_FILE, text)
    const languageService = ts.createLanguageService(host)
    const pluginLanguageService = factory({ typescript: ts }).create({
      project: { getCurrentDirectory: () => PROJECT_DIR } as unknown as ts.server.Project,
      languageService,
      languageServiceHost: host,
      serverHost: {} as ts.server.ServerHost,
      config: {},
    })
    const position = text.indexOf("''") + 1

    await Promise.resolve()
    await Promise.resolve()
    const before = pluginLanguageService.getCompletionsAtPosition(CONFIG_FILE, position, {})
    expect(before?.entries.some((entry) => entry.name === 'red.500')).toBe(true)
    expect(before?.entries.some((entry) => entry.name === 'blue.500')).toBe(false)

    // Swap in a "reloaded" project, as if the config's own tokens changed on disk.
    project = buildProject('blue')
    pluginLanguageService.getCompletionsAtPosition(CONFIG_FILE, position, {}) // triggers the refresh
    await Promise.resolve()
    await Promise.resolve()

    const after = pluginLanguageService.getCompletionsAtPosition(CONFIG_FILE, position, {})
    expect(after?.entries.some((entry) => entry.name === 'blue.500')).toBe(true)
    expect(after?.entries.some((entry) => entry.name === 'red.500')).toBe(false)
  })
})
