import { logger } from '@pandacss/logger'
import { Obj, pipe, tap, tryCatch } from 'lil-fp'
import { createBox } from './cli-box'
import type { PandaContext } from './create-context'
import { writeFile } from 'fs/promises'
import type { Artifact } from '@pandacss/types'

export async function bundleChunks(ctx: PandaContext) {
  const files = ctx.chunks.getFiles()
  await ctx.output.write({
    dir: ctx.paths.root,
    files: [{ file: 'styles.css', code: ctx.getCss({ files }) }],
  })
  return { files, msg: ctx.messages.buildComplete(files.length) }
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

function extractFiles(ctx: PandaContext) {
  return Promise.all(ctx.getFiles().map((file) => writeFileChunk(ctx, file)))
}

const randomWords = ['Sweet', 'Divine', 'Pandalicious', 'Super']
const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

export async function emitArtifacts(ctx: PandaContext) {
  if (ctx.config.clean) ctx.output.empty()
  const artifacts = ctx.getArtifacts()
  await Promise.all(
    ctx.config.emitPackage ? artifacts.map((a) => updatePackageJsonIfExists(a, ctx)) : artifacts.map(ctx.output.write),
  )
  ctx.hooks.callHook('generator:done')
  return {
    box: createBox({
      content: ctx.messages.codegenComplete(),
      title: `🐼 ${pickRandom(randomWords)}! ✨`,
    }),
    msg: ctx.messages.artifactsGenerated(),
  }
}

async function updatePackageJsonIfExists(artifact: Artifact, ctx: PandaContext) {
  const entry = artifact?.files[0]

  if (entry && entry.code && entry.file === 'package.json') {
    const pkgJsonPath = ctx.output.relative(entry.file, artifact.dir)
    const exists = await ctx.runtime.fs.exists(pkgJsonPath)

    if (exists) {
      const pandaExports = JSON.parse(entry.code).exports as Record<string, unknown>
      const currentPkgJson = JSON.parse(await ctx.runtime.fs.readFile(pkgJsonPath))
      const updated = Object.assign(currentPkgJson, {
        exports: Object.assign(currentPkgJson.exports, pandaExports),
      })

      return ctx.output.write({
        files: [{ file: 'package.json', code: JSON.stringify(updated) }],
      })
    }
  }

  return ctx.output.write(artifact)
}

export async function emitAndExtract(ctx: PandaContext) {
  await emitArtifacts(ctx)
  if (ctx.config.emitTokensOnly) {
    return { files: [], msg: 'Successfully rebuilt the css variables and js function to query your tokens ✨' }
  }
  return extractCss(ctx)
}

export async function extractCss(ctx: PandaContext) {
  await extractFiles(ctx)
  return bundleChunks(ctx)
}

export async function bundleCss(ctx: PandaContext, outfile: string) {
  const extracted = await extractFiles(ctx)
  const files = ctx.chunks.getFiles()
  await writeFile(outfile, ctx.getCss({ files, resolve: true }))
  return { files, msg: ctx.messages.buildComplete(extracted.length) }
}
