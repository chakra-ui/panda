import { optimizeCss } from '@pandacss/core'
import { logger } from '@pandacss/logger'
import { writeFile } from 'fs/promises'
import pLimit from 'p-limit'
import { match } from 'ts-pattern'
import { createBox } from './cli-box'
import type { PandaContext } from './create-context'

/**
 * Bundles all the included files CSS into outdir/styles.css
 * And import the root CSS artifacts files (global, static, reset, tokens, keyframes) in there
 */
export async function bundleStyleChunksWithImports(ctx: PandaContext) {
  const outfile = ctx.runtime.path.join(...ctx.paths.root, 'styles.css')
  return bundleCss(ctx, outfile, false)
}

/**
 * Parse a file and return the corresponding css
 */
export function extractFile(ctx: PandaContext, relativeFile: string) {
  const {
    runtime: { path },
    config: { cwd },
  } = ctx
  const file = path.abs(cwd, relativeFile)
  logger.debug('file:extract', file)

  try {
    const measure = logger.time.debug(`Parsed ${file}`)
    const result = ctx.project.parseSourceFile(file)
    measure()
    return result
  } catch (error) {
    logger.error('file:extract', error)
  }
}

const randomWords = ['Sweet', 'Divine', 'Pandalicious', 'Super']
const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

const limit = pLimit(20)

export async function emitArtifacts(ctx: PandaContext) {
  if (ctx.config.clean) ctx.output.empty()

  // limit concurrency since we might output a lot of files
  const promises = ctx.getArtifacts().map((artifact) => limit(() => ctx.output.write(artifact)))
  await Promise.allSettled(promises)

  void ctx.hooks.callHook('generator:done')

  return {
    box: createBox({
      content: ctx.messages.codegenComplete(),
      title: `🐼 ${pickRandom(randomWords)}! ✨`,
    }),
    msg: ctx.messages.artifactsGenerated(),
  }
}

export async function emitArtfifactsAndCssChunks(ctx: PandaContext) {
  await emitArtifacts(ctx)
  if (ctx.config.emitTokensOnly) {
    return { files: [], msg: 'Successfully rebuilt the css variables and js function to query your tokens ✨' }
  }
  return bundleStyleChunksWithImports(ctx)
}

/**
 * Bundles all the included files CSS into the given outfile
 * Including the root CSS artifact files content (global, static, reset, tokens, keyframes)
 * Without any imports
 */
export async function bundleCss(ctx: PandaContext, outfile: string, resolve = true) {
  const minify = ctx.config.minify
  const files = ctx.getFiles().map((file) => extractFile(ctx, file))

  const css = optimizeCss(ctx.getCss({ resolve }), { minify })

  await writeFile(outfile, css)
  return { files, msg: ctx.messages.buildComplete(files.length) }
}

/**
 * Bundles all the files CSS into outdir/{file}.css
 * Without writing any chunks or needing any imports
 */
export async function bundleMinimalFilesCss(ctx: PandaContext, outfile: string) {
  const files = ctx.getFiles()
  const filesWithCss = []

  const collect = ctx.project.fork()
  files.forEach((file) => {
    const measure = logger.time.debug(`Parsed ${file}`)
    const result = ctx.project.parseSourceFile(file)

    measure()
    if (!result) return

    filesWithCss.push(file)
  })

  const css = ctx.getParserCss(collect(), outfile)
  if (!css) return { files, msg: ctx.messages.buildComplete(files.length) }

  const minify = ctx.config.minify
  await writeFile(outfile, optimizeCss(css, { minify }))
  return { files, msg: ctx.messages.buildComplete(files.length) }
}

export type CssArtifactType = 'preflight' | 'tokens' | 'static' | 'global' | 'keyframes'

/**
 * Generates the CSS for a given artifact type
 */
export async function generateCssArtifactOfType(ctx: PandaContext, cssType: CssArtifactType, outfile: string) {
  let notFound = false
  const css = match(cssType)
    .with('preflight', () => ctx.getResetCss(ctx))
    .with('tokens', () => ctx.getTokenCss(ctx))
    .with('static', () => ctx.getStaticCss(ctx))
    .with('global', () => ctx.getGlobalCss(ctx))
    .with('keyframes', () => ctx.getKeyframeCss(ctx))
    .otherwise(() => {
      notFound = true
    })

  if (notFound) return { msg: `No css artifact of type <${cssType}> was found` }
  if (!css) return { msg: `No css to generate for type <${cssType}>` }

  const minify = ctx.config.minify
  await writeFile(outfile, optimizeCss(css, { minify }))
  return { msg: `Successfully generated ${cssType} css artifact ✨` }
}
