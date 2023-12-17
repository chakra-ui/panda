import { Monaco as MonacoType } from '@monaco-editor/react'
import * as Monaco from 'monaco-editor'
import { Artifact } from '@pandacss/types'

interface Import {
  name: string
}

interface ImportObject extends Import {
  file: File
}

interface File {
  path: string
  aliases?: string[]

  imports?: Import[]
}

const IMPORT_COMMAND = 'resolveImport'

type AutoImportOpts = {
  monaco: MonacoType
  editor: Monaco.editor.IStandaloneCodeEditor
  artifacts: Artifact[]
}

export const configureAutoImports = (opts: AutoImportOpts) => {
  const { monaco, editor, artifacts } = opts

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
        suggestions: buildSuggestions({ range, model, monaco }),
      }
    },
  })
}

type BuildSuggestionsOpts = {
  range: Monaco.IRange
  model: Monaco.editor.ITextModel
  monaco: MonacoType
}

const buildSuggestions = (opts: BuildSuggestionsOpts): Monaco.languages.CompletionItem[] => {
  const { monaco, range, model } = opts
  const SUGGESTIONS_TEMPLATE = [
    { label: 'css', documentation: 'css', path: 'css' },
    { label: 'cx', documentation: 'cx', path: 'css' },
  ]

  return SUGGESTIONS_TEMPLATE.map(({ label, documentation, path }) => ({
    label,
    kind: monaco.languages.CompletionItemKind.Function,
    documentation,
    insertText: label,
    range: range,
    command: {
      title: 'Panda Autocomplete',
      id: IMPORT_COMMAND,
      arguments: [
        {
          name: label,
          file: {
            path: `styled-system/${path}`,
          },
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

    const imports = [...workingString.split(','), imp.name]

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
  const imports = parsed.filter(({ path }) => path === imp.file.path || (imp.file.aliases?.indexOf(path) || -1) > -1)

  const importResolved = imports.findIndex((i) => i.names.indexOf(imp.name) > -1) > -1

  return { imports, importResolved, fileResolved: !!imports.length }
}

/**
 * Adds a new import statement to the editor model
 */
const createImportStatement = (
  imp: ImportObject | { name: string; path: string },
  endline: boolean = false,
): string => {
  console.log('imp', imp)
  const path = 'path' in imp ? imp.path : imp.file.aliases?.[0] || imp.file.path

  const formattedPath = path.replace(/"/g, '').replace(/'/g, '')
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

// TODO auto imports for config helpers like defineRecipe
// cx
// css
// jsx
// cva
// sva
// recipes
// patterns
// token from styled-system/tokens'
