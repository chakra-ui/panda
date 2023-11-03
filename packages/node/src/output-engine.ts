import type { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import type { Artifact, PandaHookable } from '@pandacss/types'
import type { Runtime } from '@pandacss/types'

export const getOutputEngine = ({
  paths,
  runtime: { path, fs },
}: Generator & { runtime: Runtime; hooks: PandaHookable }): PandaOutputEngine => ({
  empty() {
    fs.rmDirSync(path.join(...paths.root))
  },
  async write(output: Artifact | undefined) {
    if (!output) return

    const { dir = paths.root, files } = output
    fs.ensureDirSync(path.join(...dir))

    return Promise.allSettled(
      files.map(async (artifact) => {
        if (!artifact?.code) return

        const { file, code } = artifact
        const absPath = path.join(...dir, file)

        logger.debug('write:file', dir.slice(-1).concat(file).join('/'))
        return fs.writeFile(absPath, code)
      }),
    )
  },
})

export interface PandaOutputEngine {
  empty(): void
  write(output: Artifact | undefined): Promise<PromiseSettledResult<void>[] | undefined>
}
