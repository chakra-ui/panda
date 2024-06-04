import type { ArtifactFileId, DiffConfigResult } from '@pandacss/types'
import pLimit from 'p-limit'
import type { PandaContext } from './create-context'
import { logger } from '@pandacss/logger'

const limit = pLimit(20)

type ArtifactEntry = [id: ArtifactFileId, absPath: string]
let lastArtifact: Array<ArtifactEntry> = []

export async function codegen(ctx: PandaContext, changes?: DiffConfigResult) {
  if (ctx.config.clean) ctx.output.empty()

  const artifacts = ctx.getArtifacts(changes)
  const changed = Array.from(artifacts.changed)
  let generated = artifacts.generated

  if (ctx.hooks['codegen:prepare']) {
    const update = await ctx.hooks['codegen:prepare']?.({ changed, artifacts: generated })
    if (update) generated = update as typeof generated
  }

  // If a previously included artifact is not included anymore (dynamically added due to a config change)
  // or if an artifact is now empty (from an early return in it's `code` method after a config change)
  const included = artifacts.map
    .getFiles()
    .map((artifact) => [artifact.id, ctx.runtime.path.join(...artifact.getPath(ctx))] as ArtifactEntry)
  const removed = lastArtifact.filter(
    ([id, path]) => !included.some(([_, includedPath]) => path === includedPath) || artifacts.empty.includes(id),
  )
  removed.forEach(([_id, path]) => {
    ctx.output.rm(path)
  })

  if (removed.length) logger.debug('artifacts:remove', { removed: removed.map(([id]) => id) })
  lastArtifact = included

  // limit concurrency since we might output a lot of files
  const promises = generated.map((artifact) => limit(() => ctx.output.write(artifact)))
  await Promise.allSettled(promises)

  await ctx.hooks['codegen:done']?.({ changed })

  return {
    box: ctx.initMessage(),
    msg: ctx.messages.artifactsGenerated(),
  }
}
