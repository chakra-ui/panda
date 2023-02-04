import { bundleChunks } from './chunks'
import type { PandaContext } from './context'
import { extractFiles, extractGlobalCss, extractStaticCss } from './extract'
import { generateSystem } from './generators'
import { artifactsGeneratedMessage, buildCompleteMessage, scaffoldCompleteMessage } from './messages'

export async function emitArtifacts(ctx: PandaContext) {
  if (ctx.clean) await ctx.cleanOutdir()
  const tasks = generateSystem(ctx).map((file) => ctx.writeOutput(file))
  await Promise.all(tasks)
  return artifactsGeneratedMessage(ctx) + scaffoldCompleteMessage()
}

export async function emitAndExtract(ctx: PandaContext) {
  await emitArtifacts(ctx)
  return extractCss(ctx)
}

export async function extractCss(ctx: PandaContext) {
  await extractGlobalCss(ctx)
  await extractStaticCss(ctx)
  await extractFiles(ctx)
  await bundleChunks(ctx)
  return buildCompleteMessage(ctx)
}
