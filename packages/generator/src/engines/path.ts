import type { UserConfig } from '@pandacss/types'

export const getPathEngine = ({ cwd, emitPackage, outdir }: UserConfig) => {
  const get = (file?: string) =>
    [cwd, emitPackage ? 'node_modules' : undefined, outdir, file].filter(Boolean) as string[]
  return {
    get,
    root: get(),
    css: get('css'),
    token: get('tokens'),
    types: get('types'),
    recipe: get('recipes'),
    pattern: get('patterns'),
    chunk: get('chunks'),
    outCss: get('styles.css'),
    jsx: get('jsx'),
  }
}
