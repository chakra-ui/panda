import { colors, logger } from '@pandacss/logger'
import type { PandaContext } from './create-context'
import * as nodePath from 'path'

export async function debugFiles(ctx: PandaContext, options: { outdir: string; dry: boolean }) {
  const files = ctx.getFiles()
  const measureTotal = logger.time.debug(`Done parsing ${files.length} files`)

  // easier to debug
  ctx.config.minify = false
  ctx.config.optimize = true

  const { fs, path } = ctx.runtime
  const outdir = options.outdir

  if (!options.dry && outdir) {
    fs.ensureDirSync(outdir)
    logger.info('cli', `Writing ${colors.bold(`${outdir}/config.json`)}`)
    await fs.writeFile(`${outdir}/config.json`, JSON.stringify(ctx.config, null, 2))
  }

  const filesWithCss = []
  await Promise.allSettled(
    files.map(async (file) => {
      const measure = logger.time.debug(`Parsed ${file}`)
      const result = ctx.project.parseSourceFile(file)

      measure()
      if (!result) return

      const css = ctx.getParserCss(file)
      if (!css) return

      if (options.dry) {
        console.log({ path: file, ast: result, code: css })
        return Promise.resolve()
      }

      if (outdir) {
        filesWithCss.push(file)
        const parsedPath = nodePath.parse(file)
        const relative = path.relative(ctx.config.cwd, parsedPath.dir)

        const astJsonPath = `${relative}/${parsedPath.name}.ast.json`.replaceAll(path.sep, '__')
        const cssPath = `${relative}/${parsedPath.name}.css`.replaceAll(path.sep, '__')

        logger.info('cli', `Writing ${colors.bold(`${outdir}/${astJsonPath}`)}`)
        logger.info('cli', `Writing ${colors.bold(`${outdir}/${cssPath}`)}`)

        return Promise.allSettled([
          fs.writeFile(`${outdir}/${astJsonPath}`, JSON.stringify(result.toJSON(), null, 2)),
          fs.writeFile(`${outdir}/${cssPath}`, css),
        ])
      }
    }),
  )

  logger.info('cli', `Found ${colors.bold(`${filesWithCss.length}/${files.length}`)} files using Panda`)
  measureTotal()
}
