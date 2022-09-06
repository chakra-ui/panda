import outdent from 'outdent'
import path from 'path'
import esbuild from 'esbuild'

function readAtomicPkgFiles() {
  const basePath = path.join(path.dirname(require.resolve('@css-panda/core')), 'src')

  const { outputFiles } = esbuild.buildSync({
    write: false,
    metafile: true,
    entryPoints: [path.join(basePath, 'classname.ts')],
    bundle: true,
    format: 'esm',
  })

  const [{ text }] = outputFiles
  return text
}

export function generateSerializer(hash?: boolean) {
  const code = readAtomicPkgFiles()

  return {
    css: outdent`
    // panda.config
    import { transform } from "./transform"
    import { createCss } from "./serializer"
      
    const context = ${hash ? '{ transform, hash: true }' : '{ transform }'}
      
    export const css = createCss(context)
    `,

    serializer: outdent`
    ${code}
    `,
    dts: outdent`
    import { UserCssObject } from '../types/public'
    export declare function css(styles: UserCssObject): string
    `,
  }
}
