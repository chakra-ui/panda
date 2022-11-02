import { Stylesheet } from '@css-panda/core'
import { logger } from '@css-panda/logger'
import type { PandaContext } from './context'
import { extractFile } from './extract'

export async function extractAssets(ctx: PandaContext) {
  const sheet = new Stylesheet(ctx.context(), {
    content: [
      '@layer reset, base, tokens, recipes, utilities;',
      ctx.preflight && "@import './reset.css';",
      !ctx.tokens.isEmpty && "@import './tokens/index.css';",
      ctx.keyframes && "@import './tokens/keyframes.css';",
    ]
      .filter(Boolean)
      .join('\n\n'),
  })

  const files = ctx.assets.getFiles()

  await Promise.all(
    files.map(async (file) => {
      const css = await ctx.assets.readFile(file)
      sheet.append(css)
    }),
  )

  return sheet.toCss({ minify: ctx.minify })
}

export async function bundleAssets(ctx: PandaContext) {
  const css = await extractAssets(ctx)
  await ctx.write(ctx.outdir, [{ file: 'styles.css', code: css }])
}

export async function writeFileAsset(ctx: PandaContext, file: string) {
  logger.info(`File changed: ${file}`)
  const result = extractFile(ctx, file)
  if (!result) return
  await ctx.assets.write(result.file, result.css)
}
