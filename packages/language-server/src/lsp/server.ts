import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TextDocuments, type Connection, type CompletionItem, type Hover } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import type { ImportMapOutput } from '@pandacss/types'
import { ProjectRegistry, SpecIndex } from '@pandacss/compiler/tooling'
import { getCompletions, getHover, type LanguageServiceContext } from '@pandacss/typescript-plugin/service'

const EMPTY_IMPORT_MAP: ImportMapOutput = { css: [], recipe: [], pattern: [], jsx: [], tokens: [] }

export interface CreateServerOptions {
  registry?: ProjectRegistry
}

export function createServer(connection: Connection, options: CreateServerOptions = {}): void {
  const registry = options.registry ?? new ProjectRegistry()
  const documents = new TextDocuments(TextDocument)

  async function resolveContext(fileName: string): Promise<LanguageServiceContext | undefined> {
    try {
      const project = await registry.getProject({ cwd: dirname(fileName) })
      return {
        specIndex: new SpecIndex(project.compiler.spec()),
        importMap: project.compiler.spec().importMap ?? EMPTY_IMPORT_MAP,
        outdir: project.outdir,
      }
    } catch {
      return undefined
    }
  }

  connection.onInitialize(() => ({
    capabilities: {
      textDocumentSync: 1,
      completionProvider: {},
      hoverProvider: true,
    },
  }))

  connection.onCompletion(async (params): Promise<CompletionItem[]> => {
    const document = documents.get(params.textDocument.uri)
    if (!document) return []
    const fileName = fileURLToPath(params.textDocument.uri)
    const context = await resolveContext(fileName)
    if (!context) return []

    const position = document.offsetAt(params.position)
    const entries = getCompletions({ fileName, source: document.getText(), position }, context)
    return entries.map((entry) => ({ label: entry.name }))
  })

  connection.onHover(async (params): Promise<Hover | null> => {
    const document = documents.get(params.textDocument.uri)
    if (!document) return null
    const fileName = fileURLToPath(params.textDocument.uri)
    const context = await resolveContext(fileName)
    if (!context) return null

    const position = document.offsetAt(params.position)
    const hover = getHover({ fileName, source: document.getText(), position }, context)
    if (!hover) return null

    return {
      contents: { kind: 'plaintext', value: hover.text },
      range: { start: document.positionAt(hover.start), end: document.positionAt(hover.end) },
    }
  })

  documents.listen(connection)
  connection.listen()
}
