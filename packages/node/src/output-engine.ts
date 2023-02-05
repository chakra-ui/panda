import type { Generator } from '@pandacss/generator'
import type { Artifact } from '@pandacss/types'
import type { Runtime } from '@pandacss/types/src/runtime'

export const getOutputEngine = ({ paths, runtime: { path, fs } }: Generator & { runtime: Runtime }) => ({
  empty() {
    fs.rmDirSync(path.join(...paths.root))
  },
  async write(output: Artifact | undefined) {
    if (!output) return

    const { dir = paths.root, files } = output
    fs.ensureDirSync(path.join(...dir))

    return Promise.all(
      files.map(async ({ file, code }) => {
        const absPath = path.join(...dir, file)
        if (code) {
          return fs.writeFile(absPath, code)
        }
      }),
    )
  },
})
