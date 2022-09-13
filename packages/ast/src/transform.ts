import * as swc from '@swc/core'

type TransformOptions = {
  plugins: swc.Plugin[]
}

function getSwcOptions(options: TransformOptions): swc.Options {
  const { plugins } = options
  return {
    plugin: swc.plugins(plugins),
    jsc: { parser: { tsx: true, syntax: 'typescript' } },
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
