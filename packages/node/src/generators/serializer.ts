import esbuild from 'esbuild'
import outdent from 'outdent'
import { getEntrypoint } from './__utils'

function readAtomicPkgFiles() {
  const filepath = getEntrypoint('@css-panda/core', {
    dev: 'classname.ts',
    prod: 'classname.mjs',
  })

  const { outputFiles } = esbuild.buildSync({
    write: false,
    metafile: true,
    entryPoints: [filepath],
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
    import { sortConditions } from "./conditions"

    const conditions = { shift: sortConditions }
    const context = ${hash ? '{ transform, conditions, hash: true }' : '{ transform, conditions }'}
      
    export const css = createCss(context)
    `,

    serializer: outdent`
    ${code}
    `,
    dts: outdent`
    import { CssObject } from '../types/public'
    export declare function css(styles: CssObject): string
    `,
  }
}
