import type { Generator } from '@pandacss/generator'
import type { Artifact, PandaHookable } from '@pandacss/types'
import type { Runtime } from '@pandacss/types/src/runtime'

export const getOutputEngine = ({
  paths,
  runtime: { path, fs },
}: Generator & { runtime: Runtime; hooks: PandaHookable }) => ({
  empty() {
    fs.rmDirSync(path.join(...paths.root))
  },
  relative(file: string, dir = paths.root) {
    return path.join(...dir, file)
  },
  async write(output: Artifact | undefined) {
    if (!output) return

    const { dir = paths.root, files } = output
    const dirPath = path.join(...dir)
    fs.ensureDirSync(dirPath)

    return Promise.all(
      files.map(async ({ file, code }) => {
        const absPath = path.join(dirPath, file)
        if (code) {
          return fs.writeFile(absPath, code)
        }
      }),
    )
  },
})
