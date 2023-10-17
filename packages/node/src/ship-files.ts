import { colors, logger } from '@pandacss/logger'
import { writeFile } from 'fs/promises'
import * as path from 'path'
import type { PandaContext } from './create-context'
import { version } from '../package.json'

export async function shipFiles(ctx: PandaContext, outfile: string) {
  const files = ctx.getFiles()
  const filesWithCss = [] as string[]

  // TODO check diff ship website before PR + after
  files.forEach(async (file) => {
    const result = ctx.project.parseSourceFile(file)
    if (!result || result.isEmpty()) return

    filesWithCss.push(path.relative(ctx.config.cwd, file))
  })

  logger.info('cli', `Found ${colors.bold(`${filesWithCss.length}/${files.length}`)} files using Panda`)

  const minify = ctx.config.minify
  logger.info('cli', `Writing ${minify ? '[min] ' : ' '}${colors.bold(outfile)}`)

  const unpacked = ctx.collectStyles()
  if (!unpacked) return

  const json = unpacked
  // TODO
  const styles = {
    css: Array.from(json.atomic).map(({ hash, result }) => ({ hash, result })),
    // recipe_base: Array.from(json.recipes_base).map(({}) => ({ hash, result})),
    // recipe: Object.fromEntries(
    //   Object.entries(json.recipes).map(([name, list]) => [name, list.map((item) => item.data[0])]),
    // ),
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
