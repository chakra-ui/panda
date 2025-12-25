import type { ArtifactId } from '@pandacss/types'
import type { PandaContext } from './create-context'

export async function codegen(ctx: PandaContext, ids?: ArtifactId[]) {
  const { default: pLimit } = await import('p-limit')
  const limit = pLimit(20)
  if (ctx.config.clean) ctx.output.empty()

  let artifacts = ctx.getArtifacts(ids)
  if (ctx.hooks['codegen:prepare']) {
    const results = await ctx.hooks['codegen:prepare']?.({ changed: ids, artifacts })
    if (results) artifacts = results
  }

  // limit concurrency since we might output a lot of files
  const promises = artifacts.map((artifact) => limit(() => ctx.output.write(artifact)))
  await Promise.allSettled(promises)

  await ctx.hooks['codegen:done']?.({ changed: ids })

  return {
    box: ctx.initMessage(),
    msg: ctx.messages.artifactsGenerated(),
  }
}
