import outdent from 'outdent'
import path from 'path'
import esbuild from 'esbuild'

function readAtomicPkgFiles() {
  const basePath = path.join(path.dirname(require.resolve('@css-panda/atomic')), 'src')

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

export function generateSerializer(transform: string) {
  const code = readAtomicPkgFiles()

  return outdent`
    // panda.config
      import { transform } from '${transform}'
      
      const context = { transform }

      ${code}
    `
}
