import { build, Plugin } from 'esbuild'
import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths'
import path from 'path'
import { lookItUpSync } from 'look-it-up'
import { pathToFileURL } from 'url'

export async function bundleConfigFile(
  fileName: string,
  isESM = false,
): Promise<{ code: string; dependencies: string[] }> {
  //
  const externalPlugin: Plugin = {
    name: 'externalize-deps',
    setup(build) {
      build.onResolve({ filter: /.*/ }, ({ path: id, importer }) => {
        if (id[0] !== '.' && !path.isAbsolute(id)) {
          return { external: true }
        }

        const idFsPath = path.resolve(path.dirname(importer), id)
        const idPkgPath = lookItUpSync(idFsPath, `package.json`)

        if (idPkgPath) {
          const idPkgDir = path.dirname(idPkgPath)
          if (path.relative(idPkgDir, fileName).startsWith('..')) {
            return {
              path: isESM ? pathToFileURL(idFsPath).href : idFsPath,
              external: true,
            }
          }
        }
      })
    },
  }

  const result = await build({
    absWorkingDir: process.cwd(),
    entryPoints: [fileName],
    outfile: 'out.js',
    write: false,
    platform: 'node',
    bundle: true,
    format: isESM ? 'esm' : 'cjs',
    sourcemap: false,
    metafile: true,
    plugins: [TsconfigPathsPlugin({}), externalPlugin],
  })

  const { text } = result.outputFiles[0]

  return {
    code: text,
    dependencies: result.metafile ? Object.keys(result.metafile.inputs) : [],
  }
}
