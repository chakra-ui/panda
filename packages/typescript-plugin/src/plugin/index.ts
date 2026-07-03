import ts from 'typescript'
import type { ImportMapOutput } from '@pandacss/compiler-shared'
import { createProjectFromConfig, SpecIndex, type CompletionEntry, type Project } from '@pandacss/compiler/tooling'
import { getCompletions, getHover, type LanguageServiceContext } from '../service/language-service'

const EMPTY_IMPORT_MAP: ImportMapOutput = { css: [], recipe: [], pattern: [], jsx: [], tokens: [] }

export type ProjectLoader = (key: { cwd: string }) => Promise<Project>

function readScriptText(host: ts.LanguageServiceHost, fileName: string): string | undefined {
  const snapshot = host.getScriptSnapshot(fileName)
  return snapshot?.getText(0, snapshot.getLength())
}

interface DocumentSource {
  source: string
  sourceFile?: ts.SourceFile
}

// Reuses tsserver's own incrementally-updated Program/SourceFile when available, avoiding a
// redundant full re-parse of the file on every completion/hover request.
function readDocument(
  languageService: ts.LanguageService,
  host: ts.LanguageServiceHost,
  fileName: string,
): DocumentSource | undefined {
  const sourceFile = languageService.getProgram()?.getSourceFile(fileName)
  if (sourceFile) return { source: sourceFile.text, sourceFile }
  const source = readScriptText(host, fileName)
  return source === undefined ? undefined : { source }
}

function mergeCompletions(prior: ts.CompletionInfo | undefined, entries: CompletionEntry[]): ts.CompletionInfo {
  const pandaEntries: ts.CompletionEntry[] = entries.map((entry) => ({
    name: entry.name,
    kind: ts.ScriptElementKind.string,
    kindModifiers: '',
    sortText: '0',
    source: 'panda-css',
  }))

  if (!prior) {
    return {
      isGlobalCompletion: false,
      isMemberCompletion: false,
      isNewIdentifierLocation: false,
      entries: pandaEntries,
    }
  }
  return { ...prior, entries: [...pandaEntries, ...prior.entries] }
}

export function createPluginModuleFactory(
  loadProject: ProjectLoader = createProjectFromConfig,
): ts.server.PluginModuleFactory {
  return () => {
    function create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      const proxy = Object.create(null) as ts.LanguageService
      for (const key of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
        const original = info.languageService[key] as (...args: unknown[]) => unknown
        // @ts-expect-error -- proxying a heterogeneous method table onto `Object.create(null)`
        proxy[key] = (...args: unknown[]) => original.apply(info.languageService, args)
      }

      // Completion methods must stay synchronous but project loading isn't — kick it off
      // once; until it resolves, Panda completions are simply absent.
      let context: LanguageServiceContext | undefined
      loadProject({ cwd: info.project.getCurrentDirectory() })
        .then((project) => {
          context = {
            specIndex: new SpecIndex(project.compiler.spec()),
            importMap: project.compiler.spec().importMap ?? EMPTY_IMPORT_MAP,
            outdir: project.outdir,
          }
        })
        .catch(() => undefined)

      proxy.getCompletionsAtPosition = (fileName, position, options, formattingSettings) => {
        const prior = info.languageService.getCompletionsAtPosition(fileName, position, options, formattingSettings)
        if (!context) return prior
        const doc = readDocument(info.languageService, info.languageServiceHost, fileName)
        if (!doc) return prior

        const entries = getCompletions({ fileName, position, ...doc }, context)
        return entries.length === 0 ? prior : mergeCompletions(prior, entries)
      }

      proxy.getQuickInfoAtPosition = (fileName, position) => {
        const prior = info.languageService.getQuickInfoAtPosition(fileName, position)
        if (!context) return prior
        const doc = readDocument(info.languageService, info.languageServiceHost, fileName)
        if (!doc) return prior

        const hover = getHover({ fileName, position, ...doc }, context)
        if (!hover) return prior

        return {
          kind: ts.ScriptElementKind.string,
          kindModifiers: '',
          textSpan: { start: hover.start, length: hover.end - hover.start },
          displayParts: [{ text: hover.text, kind: 'text' }],
        }
      }

      return proxy
    }

    return { create }
  }
}

const factory = createPluginModuleFactory()
export default factory
