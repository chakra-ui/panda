import type { ImportDeclaration } from 'ts-morph'

export const getModuleSpecifierValue = (node: ImportDeclaration) => {
  try {
    return node.getModuleSpecifierValue()
  } catch {
    return
  }
}
