import type { DiffConfigResult } from '@pandacss/types'
import pLimit from 'p-limit'
import { createBox } from './cli-box'
import type { PandaContext } from './create-context'

const randomWords = ['Sweet', 'Divine', 'Pandalicious', 'Super']
const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

const limit = pLimit(20)

export async function codegen(ctx: PandaContext, changes?: DiffConfigResult) {
  if (ctx.config.clean) ctx.output.empty()

  const artifacts = ctx.getArtifacts(changes)
  const changed = Array.from(artifacts.changed)
  let generated = artifacts.generated

  if (ctx.hooks['codegen:prepare']) {
    const update = await ctx.hooks['codegen:prepare']?.({ changed, artifacts: generated })
    if (update) generated = update as typeof generated
  }

  // limit concurrency since we might output a lot of files
  const promises = generated.map((artifact) => limit(() => ctx.output.write(artifact)))
  await Promise.allSettled(promises)

  await ctx.hooks['codegen:done']?.({ changed })

  return {
    box: createBox({
      content: ctx.messages.codegenComplete(),
      title: `🐼 ${pickRandom(randomWords)}! ✨`,
    }),
    msg: ctx.messages.artifactsGenerated(),
  }
}
