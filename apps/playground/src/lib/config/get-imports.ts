import { Dict } from '@pandacss/types'

export const getImports = (code: string) => {
  const codeWithoutComments = code.replace(/\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, '')
  const importRegex = /^\s*import\s+(?:\{([\s\S]*?)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+["']([^"']+)["']\s*;?/gm
  const imports: Dict[] = []

  let match
  while ((match = importRegex.exec(codeWithoutComments)) !== null) {
    const [, namedImports, namespaceImport, defaultImport, pkg] = match

    if (pkg === '@pandacss/dev') {
      continue
    }

    const importObj: Dict = { pkg }

    if (namedImports) {
      const namedExports = namedImports.split(',').map((e) => e.trim().split(/\s+as\s+/))
      importObj.exps = namedExports.reduce((acc, [exp, alias]) => {
        acc[exp] = alias || null
        return acc
      }, {} as Dict)
    } else if (namespaceImport) {
      importObj.exps = { [namespaceImport]: '*' }
    } else if (defaultImport) {
      importObj.exps = { default: defaultImport }
    } else {
      importObj.exps = null
    }

    const existingImport = imports.find((item) => item.pkg === pkg)

    if (existingImport) {
      Object.assign(existingImport.exps, importObj.exps)
    } else {
      imports.push(importObj)
    }
  }

  return imports as { pkg: string; exps: Dict }[]
}
