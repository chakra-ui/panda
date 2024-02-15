import type { ArtifactId } from '@pandacss/types'
import pLimit from 'p-limit'
import { createBox } from './cli-box'
import type { PandaContext } from './create-context'

const randomWords = ['Sweet', 'Divine', 'Pandalicious', 'Super']
const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

const limit = pLimit(20)

export async function codegen(ctx: PandaContext, ids?: ArtifactId[]) {
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
    box: createBox({
      content: ctx.messages.codegenComplete(),
      title: `🐼 ${pickRandom(randomWords)}! ✨`,
    }),
    msg: ctx.messages.artifactsGenerated(),
  }
}
