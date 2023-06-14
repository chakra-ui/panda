import { memo } from '@pandacss/shared'
import type { ImportDeclaration, SourceFile } from 'ts-morph'

type ImportResult = {
  name: string
  alias: string
  mod: string
}

const getModuleSpecifierValue = (node: ImportDeclaration) => {
  try {
    return node.getModuleSpecifierValue()
  } catch {
    return
  }
}

export function getImportDeclarations(
  file: SourceFile,
  options: {
    match: (value: ImportResult) => boolean
  },
) {
  const { match } = options
  const result: ImportResult[] = []

  file.getImportDeclarations().forEach((node) => {
    const source = getModuleSpecifierValue(node)
    if (!source) return

    const specifiers = node.getNamedImports()

    specifiers.forEach((specifier) => {
      const name = specifier.getNameNode().getText()
      const alias = specifier.getAliasNode()?.getText() || name

      if (!match({ name, alias, mod: source })) return

      result.push({ name, alias, mod: source })
    })
  })

  return {
    value: result,
    toString() {
      return result.map((item) => item.alias).join(', ')
    },
    find(id: string) {
      return result.find((o) => o.alias === id)
    },
    createMatch(mod: string) {
      const mods = result.filter((o) => o.mod.includes(mod))
      return memo((id: string) => !!mods.find((mod) => mod.alias === id || mod.name === id))
    },
    match(id: string) {
      return !!this.find(id)
    },
    getName(id: string) {
      return this.find(id)?.name || id
    },
    getAlias(id: string) {
      return result.find((o) => o.name === id)?.alias || id
    },
  }
}
