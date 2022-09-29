import type { PandaContext } from './context'
import { bundleAssets } from './assets'
import { extractFiles } from './file'
import { generateSystem } from './generators'
import { generateCss, generateKeyframes } from './generators/css'
import { generateReset } from './generators/reset'
import { artifactsGeneratedMessage, scaffoldCompleteMessage } from './messages'

export async function emitArtifacts(ctx: PandaContext) {
  if (ctx.clean) await ctx.cleanOutdir()
  const tasks = generateSystem(ctx).map((file) => ctx.writeOutput(file))
  await Promise.all(tasks)
  return artifactsGeneratedMessage(ctx) + scaffoldCompleteMessage()
}

export async function emitAndExtract(ctx: PandaContext) {
  await emitArtifacts(ctx)
  await extractFiles(ctx)
  await bundleAssets(ctx)
}

export function getBaseCss(ctx: PandaContext) {
  const css = [generateReset(), generateCss(ctx), generateKeyframes(ctx.keyframes)]
  return css.join('\n')
}
