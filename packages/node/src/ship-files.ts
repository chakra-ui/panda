import { colors, logger } from '@pandacss/logger'
import { createParserResult } from '@pandacss/parser'
import { writeFile } from 'fs/promises'
import * as path from 'pathe'
import type { PandaContext } from './create-context'

export async function shipFiles(ctx: PandaContext, outfile: string) {
  const files = ctx.getFiles()

  const extractResult = createParserResult()
  const filesWithCss = [] as string[]

  files.forEach(async (file) => {
    const result = ctx.project.parseSourceFile(file)
    if (!result || result.isEmpty()) return
    extractResult.merge(result)
    filesWithCss.push(path.relative(ctx.config.cwd, file))
  })

  logger.info('cli', `Found ${colors.bold(`${filesWithCss.length}/${files.length}`)} files using Panda`)

  const minify = ctx.config.minify
  logger.info('cli', `Writing ${minify ? '[min] ' : ' '}${colors.bold(outfile)}`)

  const output = JSON.stringify(extractResult.toJSON(), null, minify ? 0 : 2)
  const dirname = ctx.runtime.path.dirname(outfile)
  ctx.runtime.fs.ensureDirSync(dirname)
  await writeFile(outfile, output)
  logger.info('cli', 'Done!')
}
