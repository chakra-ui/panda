import type { Context } from './create-context'

export async function extractTemp(ctx: Context) {
  ctx.stylesheet.reset()
  ctx.stylesheet.addImports(['./design-tokens/index.css'])

  const files = ctx.temp.getFiles()
  await Promise.all(
    files.map(async (file) => {
      const css = await ctx.temp.readFile(file)
      ctx.stylesheet.append(css)
    }),
  )

  const css = ctx.stylesheet.toCss()
  ctx.outputCss.write(css)
}
