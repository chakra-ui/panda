import outdent from 'outdent'
import path from 'path'
import esbuild from 'esbuild'

export function generateSerializer(transform: string) {
  const filePath = require.resolve('@css-panda/atomic')
  const cssPath = path.join(path.dirname(filePath), 'src', 'classname.ts')
  const { outputFiles } = esbuild.buildSync({
    write: false,
    metafile: true,
    entryPoints: [cssPath],
    bundle: true,
    format: 'esm',
  })
  const [{ text }] = outputFiles

  return outdent`
    // panda.config
      import { transform } from '${transform}'
      
      const context = { transform }
      
      ${text}
    `
}
