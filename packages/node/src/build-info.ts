import { colors, logger } from '@pandacss/logger'
import type { PandaContext } from './create-context'

export async function buildInfo(ctx: PandaContext, outfile: string) {
  const { filesWithCss, files } = ctx.parseFiles()
  logger.info('cli', `Found ${colors.bold(`${filesWithCss.length}/${files.length}`)} files using Panda`)

  const { minify, staticCss } = ctx.config
  logger.info('cli', `Writing ${minify ? '[min] ' : ' '}${colors.bold(outfile)}`)

  if (staticCss) {
    logger.info('cli', 'Adding staticCss definitions...')
    ctx.staticCss.process(staticCss)
  }

  const output = JSON.stringify(ctx.encoder.toJSON(), null, minify ? 0 : 2)

  ctx.output.ensure(outfile, process.cwd())

  await ctx.runtime.fs.writeFile(outfile, output)
  logger.info('cli', 'Done!')
}
