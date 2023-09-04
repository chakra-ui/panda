import { logger } from '@pandacss/logger'
import { Obj, pipe, tap, tryCatch } from 'lil-fp'
import { createBox } from './cli-box'
import type { PandaContext } from './create-context'
import { writeFile } from 'fs/promises'

export async function bundleChunks(ctx: PandaContext) {
  const outfile = ctx.runtime.path.join(...ctx.paths.root, 'styles.css')
  const measure = logger.time.debug('file:write' + ' ' + outfile)
  return bundleCss(ctx, outfile, false).then((res) => {
    measure()
    return res
  })
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
  ctx.hooks.callHook('generator:done')
  return {
    box: createBox({
      content: ctx.messages.codegenComplete(),
      title: `🐼 ${pickRandom(randomWords)}! ✨`,
    }),
    msg: ctx.messages.artifactsGenerated(),
  }
}

export async function emitAndExtract(ctx: PandaContext) {
  await emitArtifacts(ctx)
  if (ctx.config.emitTokensOnly) {
    return { files: [], msg: 'Successfully rebuilt the css variables and js function to query your tokens ✨' }
  }
  return bundleChunks(ctx)
}

export async function bundleCss(ctx: PandaContext, outfile: string, resolve = true) {
  const files = ctx
    .getFiles()
    .map((file) => extractFile(ctx, file))
    .filter(Boolean) as string[]
  const css = ctx.getCss({ files, resolve })
  await writeFile(outfile, css)
  return { msg: ctx.messages.buildComplete(files.length) }
}
