import { logger } from '@pandacss/logger'
import { Obj, pipe, tap, tryCatch } from 'lil-fp'
import { createBox } from './cli-box'
import type { PandaContext } from './create-context'
import type { ParserResultJson } from '@pandacss/parser'

export async function bundleChunks(ctx: PandaContext) {
  const files = ctx.chunks.getFiles()

  await writeIncrementalBuildInfo(ctx)

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
  if (!ctx.config.chunks) return

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
    Obj.bind(
      'result',
      tryCatch(
        ({ file }) => ctx.project.parseSourceFile(file),
        (error) => logger.error('file:parse', error),
      ),
    ),
    Obj.bind('measureCss', () => logger.time.debug(`Parsed ${file}`)),
    Obj.bind('css', ({ result }) => (result ? ctx.getParserCss(result) : undefined)),
    tap(({ measure, measureCss }) => [measureCss(), measure()]),
    Obj.get('css'),
  )
}

const randomWords = ['Sweet', 'Divine', 'Pandalicious', 'Super']
const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

export async function emitArtifacts(ctx: PandaContext) {
  if (ctx.config.clean) ctx.output.empty()
  await Promise.all(ctx.getArtifacts().map(ctx.output.write))
  return (
    ctx.messages.artifactsGenerated() +
    createBox({
      content: ctx.messages.codegenComplete(),
      title: `🐼 ${pickRandom(randomWords)}! ✨`,
    })
  )
}

export async function emitAndExtract(ctx: PandaContext) {
  await emitArtifacts(ctx)
  if (ctx.config.emitTokensOnly) return 'Successfully rebuilt the css variables and js function to query your tokens ✨'

  return extractCss(ctx)
}

export async function extractCss(ctx: PandaContext) {
  const files = ctx.getFiles()
  const time = logger.time.info('Extracted css from files')
  await Promise.all(files.map((file) => writeFileChunk(ctx, file)))
  await bundleChunks(ctx)
  time()
  return ctx.messages.buildComplete(files.length)
}

export const writeIncrementalBuildInfo = (ctx: PandaContext) => {
  const { incremental } = ctx.config
  if (!incremental) return

  const { path } = ctx.runtime
  logger.debug('incremental:write', `${path.relative(ctx.config.cwd, path.join(...ctx.paths.root))}`)

  const resultMap = ctx.project.getBuildInfoMap()
  const buildInfo = {} as Record<string, { hash: string; result: ParserResultJson }>
  resultMap.forEach((info, file) => {
    buildInfo[path.relative(ctx.config.cwd, file)] = { hash: info.hash, result: info.result.toJSON() }
  })

  return ctx.output.write({
    dir: ctx.paths.root,
    files: [{ file: 'panda.buildinfo.json', code: JSON.stringify(buildInfo, null, 2) }],
  })
}
