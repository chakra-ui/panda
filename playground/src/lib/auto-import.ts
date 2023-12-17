import { Monaco as MonacoType } from '@monaco-editor/react'
import * as Monaco from 'monaco-editor'
import { Dict } from '@pandacss/types'

const IMPORT_COMMAND = 'resolveImport'

export type AutoImportContext = {
  patterns: Dict[]
  recipes: string[]
}

type AutoImportOpts = {
  monaco: MonacoType
  editor: Monaco.editor.IStandaloneCodeEditor
  context: AutoImportContext
}

interface ImportObject {
  name: string
  path: string
}

export const configureAutoImports = (opts: AutoImportOpts) => {
  const { monaco, editor, context } = opts

  monaco.languages.registerCompletionItemProvider('typescript', {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      monaco.editor.addCommand({
        id: IMPORT_COMMAND,
        run: (_, ...args: any) => {
          handleCommand(editor, range, args)
        },
      })

      return {
        suggestions: buildSuggestions({ range, model, monaco, context }),
      }
    },
  })
}

type BuildSuggestionsOpts = {
  range: Monaco.IRange
  model: Monaco.editor.ITextModel
  monaco: MonacoType
  context: AutoImportContext
}

const buildSuggestions = (opts: BuildSuggestionsOpts): Monaco.languages.CompletionItem[] => {
  const { monaco, range, model, context } = opts

  const staticImports = [
    { label: 'css', path: 'css' },
    { label: 'cx', path: 'css' },
    {
      label: 'cva',
      path: 'css',
    },
    {
      label: 'sva',
      path: 'css',
    },
    { label: 'token', path: 'tokens' },
    { label: 'isCssProperty', path: 'jsx' },
    { label: 'splitCssProps', path: 'jsx' },
  ]

  const recipeImports = context.recipes.map((r) => ({
    label: r,
    path: 'recipes',
  }))

  const patternWithJSXImports = context.patterns.flatMap((p) => [
    {
      label: p.baseName,
      path: 'patterns',
    },
    {
      label: p.jsxName,
      path: 'jsx',
    },
  ])

  const imports = staticImports.concat(recipeImports, patternWithJSXImports)

  return imports.map(({ label, path }) => ({
    label,
    kind: monaco.languages.CompletionItemKind.Method,
    documentation: `Add import from "styled-system/${path}"`,
    detail: `styled-system/${path}`,
    insertText: label,
    range: range,
    command: {
      title: 'Panda Autocomplete',
      id: IMPORT_COMMAND,
      arguments: [
        {
          name: label,
          path: `styled-system/${path}`,
        },
        model,
      ],
    },
  }))
}

const handleCommand = (
  editor: Monaco.editor.IStandaloneCodeEditor,
  range: Monaco.IRange,
  [imp, model]: [ImportObject, Monaco.editor.ITextModel],
) => {
  const edits = getTextEdits(model, imp)

  editor.executeEdits('', edits, ([ops]: any) => {
    const isNewImport = !ops.text
    const line = range.startLineNumber + (isNewImport ? 1 : 0)
    const column = range.startColumn + imp.name.length
    return [new Monaco.Selection(line, column, line, column)]
  })
}

const getTextEdits = (model: Monaco.editor.ITextModel, imp: ImportObject) => {
  const edits = new Array<Monaco.editor.IIdentifiedSingleEditOperation>()

  const { importResolved, fileResolved, imports } = parseResolved(model, imp)
  if (importResolved) return edits

  if (fileResolved) {
    edits.push({
      range: new Monaco.Range(0, 0, model.getLineCount(), 0),
      text: mergeImports(model, imp, imports[0].path),
    })
  } else {
    edits.push({
      range: new Monaco.Range(0, 0, 0, 0),
      text: createImportStatement(imp, true),
    })
  }

  return edits
}

/**
 * Merges an import statement into the editor model
 */
const mergeImports = (model: Monaco.editor.ITextModel, imp: ImportObject, path: string) => {
  const exp = new RegExp(`(?:import {)(?:.*)(?:} from ')(?:${path})(?:';)`)

  let currentDoc = model.getValue()
  const foundImport = currentDoc.match(exp)

  if (foundImport) {
    let [workingString] = foundImport

    const replaceTarget = /{|}|from|import|'|"| |;/gi

    workingString = workingString.replace(replaceTarget, '').replace(path, '')

    const imports = [...workingString.split(','), imp.name].filter(Boolean)

    const newImport = createImportStatement({
      name: imports.join(', '),
      path,
    })
    currentDoc = currentDoc.replace(exp, newImport)
  }

  return currentDoc
}

/**
 * Returns whether a given import has already been
 * resolved by the user
 */
const parseResolved = (model: Monaco.editor.ITextModel, imp: ImportObject) => {
  const exp = /(?:import[ \t]+{)(.*)}[ \t]from[ \t]['"](.*)['"]/g
  const currentDoc = model.getValue()

  const matches = getMatches(currentDoc, exp)
  const parsed = matches.map(([_, names, path]) => ({
    names: names.split(',').map((imp) => imp.trim().replace(/\n/g, '')),
    path,
  }))
  const imports = parsed.filter(({ path }) => path === imp.path)

  const importResolved = imports.findIndex((i) => i.names.indexOf(imp.name) > -1) > -1

  return { imports, importResolved, fileResolved: !!imports.length }
}

/**
 * Adds a new import statement to the editor model
 */
const createImportStatement = (imp: ImportObject, endline: boolean = false): string => {
  const formattedPath = imp.path.replace(/"/g, '').replace(/'/g, '')
  let returnStr = ''

  const newLine = endline ? '\r\n' : ''
  returnStr = `import { ${imp.name} } from '${formattedPath}';${newLine}`

  return returnStr
}

const getMatches = (string: string, regex: RegExp) => {
  const matches = []
  let match
  while ((match = regex.exec(string))) {
    matches.push(match)
  }
  return matches
}
