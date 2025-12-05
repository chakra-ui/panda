import { logger } from '@pandacss/logger'
import type { ArtifactId, SpecFile } from '@pandacss/types'
import type { PandaContext } from './create-context'

export interface SpecOptions {
  outdir?: string
}

export async function spec(ctx: PandaContext, options: SpecOptions) {
  const { outdir } = options

  const specs = ctx.getSpec()

  // Use ctx.paths.specs (includes configured outdir) or override with provided outdir
  const specDir = outdir ? [ctx.config.cwd, outdir] : ctx.paths.specs
  const specDirPath = ctx.runtime.path.join(...specDir)

  const writeSpec = async (spec: SpecFile) => {
    await ctx.output.write({
      id: `spec-${spec.type}` as ArtifactId,
      dir: specDir,
      files: [{ file: `${spec.type}.json`, code: JSON.stringify(spec, null, 2) }],
    })
  }

  await Promise.all(specs.map(writeSpec))

  const specTypes = specs.map((s) => s.type)
  logger.info('spec', `Generated ${specTypes.length} spec file(s) → ${specDirPath}`)
  return specs
}
