/* eslint-disable */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { loadConfigAndCreateContext } from '@pandacss/node'
// import { getCursorContext } from './utils/getCursorContext'

// import { Parser } from 'acorn'
// import * as walk from 'acorn-walk'
// import { default as acornJsx } from 'acorn-jsx'
// const parser = Parser.extend(acornJsx())

import { Project, ScriptKind, ts } from 'ts-morph'

const createProject = () => {
  return new Project({
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      jsxFactory: 'React.createElement',
      jsxFragmentFactory: 'React.Fragment',
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      noUnusedParameters: false,
      noEmit: true,
      useVirtualFileSystem: true,
      allowJs: true,
    },
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
  })
}

const docSelector: vscode.DocumentSelector = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact']

let run = 0

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('panda-css-extension is now active!')
  console.log({ run: run++ })

  const project = createProject()

  // const ctx = await loadConfigAndCreateContext()

  // console.log(ctx)

  // const files = vscode.workspace.findFiles('**/*.tsx', '**/node_modules/**', 1000)
  const versionByFilepath = new Map<string, number>()
  let currentFilePath: string | undefined
  let currentFileText: string | undefined
  let currentFileVersion: number | undefined

  const provider1 = vscode.languages.registerCompletionItemProvider(docSelector, {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext,
    ) {
      currentFilePath = document.uri.fsPath
      currentFileText = document.getText()

      const sourceFile = project.createSourceFile(currentFilePath, currentFileText, {
        overwrite: versionByFilepath.get(currentFilePath) !== document.version,
        scriptKind: ScriptKind.TSX,
      })

      console.log(sourceFile)

      // parsed.getLineAndColumnAtPos(position.line, )
      const pos = ts.getPositionOfLineAndCharacter(
        sourceFile.compilerNode,
        // TS uses 0-based line and char #s
        position.line,
        position.character,
      )
      console.log({ line: position.line, column: position.character, character: pos })

      const currentNode = sourceFile.getDescendantAtPos(pos)
      console.log(currentNode)
      // console.log(currentNode.getParentIfKind(ts.SyntaxKind.JsxOpeningElement))
      console.log(currentNode?.getText())

      currentFileVersion = document.version
      versionByFilepath.set(currentFilePath, currentFileVersion)

      // a simple completion item which inserts `Hello World!`
      const simpleCompletion = new vscode.CompletionItem('Hello World!')

      // a completion item that can be accepted by a commit character,
      // the `commitCharacters`-property is set which means that the completion will
      // be inserted and then the character will be typed.
      // const commitCharacterCompletion = new vscode.CompletionItem('console')
      // commitCharacterCompletion.commitCharacters = ['.']
      // commitCharacterCompletion.documentation = new vscode.MarkdownString('Press `.` to get `console.`')

      // return all completion items as array
      return [simpleCompletion]
    },
  })

  context.subscriptions.push(provider1)
  console.log('pushed provider1')
}

// This method is called when your extension is deactivated
export function deactivate() {}
