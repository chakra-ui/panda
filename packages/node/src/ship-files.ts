import { colors, logger } from '@pandacss/logger'
import { createParserResult } from '@pandacss/parser'
import { writeFile } from 'fs/promises'
import * as path from 'path'
import type { PandaContext } from './create-context'
import { version } from '../package.json'

export async function shipFiles(ctx: PandaContext, outfile: string) {
  const files = ctx.getFiles()

  const collector = createParserResult(ctx.parserOptions)
  const filesWithCss = [] as string[]

  // TODO check diff ship website before PR + after
  files.forEach(async (file) => {
    const result = ctx.project.parseSourceFile(file)
    if (!result || result.isEmpty()) return

    collector.mergeStyles(result)
    filesWithCss.push(path.relative(ctx.config.cwd, file))
  })

  logger.info('cli', `Found ${colors.bold(`${filesWithCss.length}/${files.length}`)} files using Panda`)

  const minify = ctx.config.minify
  logger.info('cli', `Writing ${minify ? '[min] ' : ' '}${colors.bold(outfile)}`)

  const unpacked = collector.collectStyles()
  const json = unpacked.toJSON()
  const styles = {
    css: json.css.map((item) => item.data[0]),
    recipe: Object.fromEntries(
      Object.entries(json.recipe).map(([name, list]) => [name, list.map((item) => item.data[0])]),
    ),
  }
  const output = JSON.stringify(
    {
      schemaVersion: version,
      styles,
    },
    null,
    minify ? 0 : 2,
  )
  await writeFile(outfile, output)
  logger.info('cli', 'Done!')
}
