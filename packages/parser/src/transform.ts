import * as swc from '@swc/core'

type FileType = 'jsx' | 'tsx' | 'js' | 'ts'

function getParser(file: FileType): swc.ParserConfig {
  const isTsx = /ts(x)?/.test(file)
  return isTsx ? { tsx: true, syntax: 'typescript' } : { jsx: true, syntax: 'ecmascript' }
}

type TransformConfig = {
  file?: FileType
  plugins: swc.Plugin[]
}

export async function transform(code: string, options: TransformConfig) {
  const { file = 'ts', plugins } = options

  return swc.transform(code, {
    plugin: swc.plugins(plugins),
    jsc: { parser: getParser(file) },
  })
}

export function transformSync(code: string, options: TransformConfig) {
  const { file = 'ts', plugins } = options

  return swc.transformSync(code, {
    plugin: swc.plugins(plugins),
    jsc: { parser: getParser(file) },
  })
}
