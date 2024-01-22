import { resolveTsPathPattern } from '@pandacss/config/ts-path'
import type { ImportResult, ParserOptions } from '@pandacss/core'
import type { SourceFile } from 'ts-morph'
import { getModuleSpecifierValue } from './get-module-specifier-value'

export function getImportDeclarations(context: ParserOptions, sourceFile: SourceFile) {
  const { imports, tsOptions } = context

  const importDeclarations: ImportResult[] = []

  sourceFile.getImportDeclarations().forEach((node) => {
    const mod = getModuleSpecifierValue(node)
    if (!mod) return

    node.getNamedImports().forEach((specifier) => {
      const name = specifier.getNameNode().getText()
      const alias = specifier.getAliasNode()?.getText() || name

      const result = { name, alias, mod }

      const found = imports.match(result, (mod) => {
        if (!tsOptions?.pathMappings) return
        return resolveTsPathPattern(tsOptions.pathMappings, mod)
      })

      if (!found) return

      importDeclarations.push(result)
    })
  })

  return importDeclarations
}
