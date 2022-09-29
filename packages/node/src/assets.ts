import { Stylesheet } from '@css-panda/core'
import { logger } from '@css-panda/logger'
import type { PandaContext } from './context'
import { extractFile } from './file'

export async function extractAssets(ctx: PandaContext) {
  const sheet = new Stylesheet(ctx.context())

  const imports: string[] = []

  if (ctx.preflight) {
    imports.push('./reset.css')
  }

  if (!ctx.tokens.isEmpty) {
    imports.push('./design-tokens/index.css')
  }

  if (ctx.keyframes) {
    imports.push('./design-tokens/keyframes.css')
  }

  sheet.addImports(imports)

  const files = ctx.assets.getFiles()

  await Promise.all(
    files.map(async (file) => {
      const css = await ctx.assets.readFile(file)
      sheet.append(css)
    }),
  )

  return sheet.toCss()
}

export async function bundleAssets(ctx: PandaContext) {
  const css = await extractAssets(ctx)
  await ctx.write(ctx.outdir, [{ file: 'styles.css', code: css }])
}

export async function writeFileAsset(ctx: PandaContext, file: string) {
  logger.info(`File changed: ${file}`)
  const result = await extractFile(ctx, file)
  if (!result) return
  await ctx.assets.write(result.file, result.css)
}
