import * as swc from '@swc/core'

const options: swc.ParseOptions = {
  tsx: true,
  syntax: 'typescript',
  decorators: true,
  dynamicImport: true,
}

export async function parseFile(file: string, plugins: swc.Plugin[]) {
  const ast = await swc.parseFile(file, options)
  plugins.forEach((plugin) => plugin(ast))
}
export async function parse(code: string, plugins: swc.Plugin[]) {
  const ast = await swc.parse(code, options)
  plugins.forEach((plugin) => plugin(ast))
}

export function parseSync(code: string, plugins: swc.Plugin[]) {
  const ast = swc.parseSync(code, options)
  plugins.forEach((plugin) => plugin(ast))
}
