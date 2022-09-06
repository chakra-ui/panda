import * as swc from '@swc/core'

type FileType = 'jsx' | 'tsx' | 'js' | 'ts'

function getParser(file: FileType): swc.ParserConfig {
  const isTsx = /ts(x)?/.test(file)
  return isTsx ? { tsx: true, syntax: 'typescript' } : { jsx: true, syntax: 'ecmascript' }
}

type TransformOptions = {
  file?: FileType
  plugins: swc.Plugin[]
}

function getSwcOptions(options: TransformOptions): swc.Options {
  const { file = 'ts', plugins } = options
  return {
    plugin: swc.plugins(plugins),
    jsc: { parser: getParser(file) },
  }
}

export async function transform(code: string, options: TransformOptions) {
  return swc.transform(code, getSwcOptions(options))
}

export function transformSync(code: string, options: TransformOptions) {
  return swc.transformSync(code, getSwcOptions(options))
}

export async function transformFile(code: string, options: TransformOptions) {
  return swc.transformFile(code, getSwcOptions(options))
}

export function transformFileSync(code: string, options: TransformOptions) {
  return swc.transformFileSync(code, getSwcOptions(options))
}
