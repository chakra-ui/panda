import { logger } from '@pandacss/logger'
import { Obj, pipe, tap } from 'lil-fp'
import type { PandaContext } from './create-context'

export async function bundleChunks(ctx: PandaContext) {
  const files = ctx.chunks.getFiles()
  return ctx.output.write({
    dir: ctx.paths.root,
    files: [{ file: 'styles.css', code: ctx.getCss({ files }) }],
  })
}

export async function writeFileChunk(ctx: PandaContext, file: string) {
  const { path } = ctx.runtime
  logger.debug('chunk:write', `File: ${path.relative(ctx.config.cwd, file)}`)
  const css = extractFile(ctx, file)
  if (!css) return
  const artifact = ctx.chunks.getArtifact(file, css)
  return ctx.output.write(artifact)
}

export function extractFile(ctx: PandaContext, file: string) {
  const {
    runtime: { path },
    config: { cwd },
  } = ctx
  return pipe(
    { file: path.abs(cwd, file) },
    tap(() => logger.debug('file:extract', file)),
    Obj.bind('measure', () => logger.time.debug(`Extracted ${file}`)),
    Obj.bind('result', ({ file }) => ctx.project.parseSourceFile(file)),
    Obj.bind('css', ({ result }) => (result ? ctx.getParserCss(result) : undefined)),
    tap(({ measure }) => measure()),
    ({ css }) => css,
  )
}

export function extractFiles(ctx: PandaContext) {
  return Promise.all(ctx.getFiles().map((file) => writeFileChunk(ctx, file)))
}

export async function emitArtifacts(ctx: PandaContext) {
  if (ctx.config.clean) ctx.output.empty()
  await Promise.all(ctx.getArtifacts().map(ctx.output.write))
  return ctx.messages.artifactsGenerated() + ctx.messages.codegenComplete()
}

export async function emitAndExtract(ctx: PandaContext) {
  await emitArtifacts(ctx)
  return extractCss(ctx)
}

export async function extractCss(ctx: PandaContext) {
  await extractFiles(ctx)
  await bundleChunks(ctx)
  return ctx.messages.buildComplete(ctx.getFiles().length)
}
