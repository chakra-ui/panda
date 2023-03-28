import { type BindingName, CallExpression, Identifier, Node, SourceFile, ts } from 'ts-morph'

import { createLogger } from './logger'
import { extract } from './extract'
import type { BoxNodeList } from './type-factory'
import type { ExtractedFunctionResult } from './types'
import { unwrapExpression } from './utils'

const logger = createLogger('box-ex:extract-function-from')

export const isImportedFrom = (
  identifier: Identifier,
  importName: string,
  canImportSourcePath?: (sourcePath: string) => boolean,
) => {
  return identifier.getDefinitions().some((def) => {
    const declaration = def.getDeclarationNode()
    if (!declaration) return false

    const sourcePath = declaration.getSourceFile().getFilePath().toString()
    logger.scoped('imported-from', { kind: declaration.getKindName(), sourcePath })
    if (canImportSourcePath?.(sourcePath)) return true

    if (!Node.isImportSpecifier(declaration)) return false

    const importedFrom = declaration.getImportDeclaration().getModuleSpecifierValue()
    return importedFrom === importName
  })
}

export const extractFunctionFrom = <Result>(
  sourceFile: SourceFile,
  functionName: string,
  getResult: (boxNode: BoxNodeList, name: string) => Result,
  options: {
    importName?: string
    canImportSourcePath?: (sourcePath: string) => boolean
  } = {},
) => {
  const resultByName = new Map<string, { result: Result; queryBox: BoxNodeList; nameNode: () => BindingName }>()
  const extractedTheme = extract({
    ast: sourceFile,
    functions: { matchFn: ({ fnName }) => fnName === functionName, matchProp: () => true, matchArg: () => true },
  })
  const fnExtraction = extractedTheme.get(functionName) as ExtractedFunctionResult
  if (!fnExtraction) return resultByName

  const queryList = fnExtraction.queryList
  const from = sourceFile.getFilePath().toString()
  logger({ from, queryList: queryList.length })

  queryList.forEach((query) => {
    const fromNode = query.box.getNode() as CallExpression
    const declaration = fromNode.getParentIfKind(ts.SyntaxKind.VariableDeclaration)
    if (!declaration) return

    const identifier = unwrapExpression(fromNode.getExpression())
    if (!Node.isIdentifier(identifier)) return

    const isImportedFromValid = options.importName
      ? isImportedFrom(identifier, options.importName, options.canImportSourcePath)
      : true
    logger({ isImportedFromValid })
    if (!isImportedFromValid) return

    const nameNode = declaration.getNameNode()
    const name = nameNode.getText()
    const result = getResult(query.box, name)
    resultByName.set(name, { result, queryBox: query.box, nameNode: () => nameNode })

    logger({ name })
  })

  return resultByName
}
