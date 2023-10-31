import { memo } from '@pandacss/shared'
import type { ImportDeclaration, SourceFile } from 'ts-morph'

export interface ImportResult {
  /** @example 'hstack' */
  name: string
  /** @example 'pandaHStack' */
  alias: string
  /**
   * @example '../../styled-system/patterns'
   * @example '@styles/patterns'
   */
  mod: string
  /**
   * If mod is a TS path mapping, this will be the matching importMap[kind] value
   * @example 'generated/panda-css/patterns'
   */
  importMapValue: string | boolean
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
    match: (value: Omit<ImportResult, 'importMapValue'>) => string | boolean
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

      const importMapValue = match({ name, alias, mod: source })
      if (!importMapValue) return

      result.push({ name, alias, mod: source, importMapValue })
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
    createMatch(mod: string, keys: string[]) {
      const mods = result.filter((o) => {
        const isFromMod = o.mod.includes(mod) || o.importMapValue === mod
        const isOneOfKeys = keys.includes(o.name)
        return isFromMod && isOneOfKeys
      })

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
