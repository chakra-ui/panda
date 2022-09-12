import type { Context } from './create-context'

export async function extractAssets(ctx: Context) {
  ctx.stylesheet.reset()

  const imports: string[] = []

  if (!ctx.dictionary.isEmpty) {
    imports.push('./design-tokens/index.css')
  }

  if (ctx.keyframes) {
    imports.push('./design-tokens/keyframes.css')
  }

  ctx.stylesheet.addImports(imports)

  const files = ctx.assets.getFiles()

  await Promise.all(
    files.map(async (file) => {
      const css = await ctx.assets.readFile(file)
      ctx.stylesheet.append(css)
    }),
  )

  return ctx.stylesheet.toCss()
}
