import * as swc from '@swc/core'

export async function parseFile(file: string, plugins: swc.Plugin[]) {
  const ast = await swc.parseFile(file, { tsx: true, syntax: 'typescript' })
  plugins.forEach((plugin) => {
    plugin(ast)
  })
}
export async function parse(code: string, plugins: swc.Plugin[]) {
  const ast = await swc.parse(code, { tsx: true, syntax: 'typescript' })
  plugins.forEach((plugin) => {
    plugin(ast)
  })
}

export async function parseSync(code: string, plugins: swc.Plugin[]) {
  const ast = swc.parseSync(code, { tsx: true, syntax: 'typescript' })
  plugins.forEach((plugin) => {
    plugin(ast)
  })
}
