import { colors } from '@pandacss/logger'
import { parse } from 'path'
import type { PandaContext } from './create-context'

export interface DebugOptions {
  outdir: string
  dry: boolean
  onlyConfig?: boolean
}

export async function debug(ctx: PandaContext, options: DebugOptions) {
  const files = ctx.getFiles()
  const measureTotal = ctx.logger.time.debug(`Done parsing ${files.length} files`)

  // easier to debug
  ctx.config.minify = false
  ctx.config.optimize = true

  const { fs, path } = ctx.runtime
  const outdir = options.outdir

  if (!options.dry && outdir) {
    fs.ensureDirSync(outdir)
    ctx.logger.info('cli', `Writing ${colors.bold(`${outdir}/config.json`)}`)
    await fs.writeFile(`${outdir}/config.json`, JSON.stringify(ctx.config, null, 2))
  }

  if (options.onlyConfig) {
    measureTotal()
    return
  }

  const filesWithCss = []

  files.map((file) => {
    const measure = ctx.logger.time.debug(`Parsed ${file}`)
    const encoder = ctx.encoder.clone()
    const result = ctx.project.parseSourceFile(file, encoder)

    measure()
    if (!result || result.isEmpty() || encoder.isEmpty()) return

    const styles = ctx.decoder.clone().collect(encoder)
    const css = ctx.getParserCss(styles)
    if (!css) return

    if (options.dry) {
      console.log({ path: file, ast: result, code: css })
      return
    }

    if (outdir) {
      filesWithCss.push(file)
      const parsedPath = parse(file)
      const relative = path.relative(ctx.config.cwd, parsedPath.dir)

      const astJsonPath = `${relative}/${parsedPath.name}.ast.json`.replaceAll(path.sep, '__')
      const cssPath = `${relative}/${parsedPath.name}.css`.replaceAll(path.sep, '__')

      ctx.logger.info('cli', `Writing ${colors.bold(`${outdir}/${astJsonPath}`)}`)
      ctx.logger.info('cli', `Writing ${colors.bold(`${outdir}/${cssPath}`)}`)

      return Promise.allSettled([
        fs.writeFile(`${outdir}/${astJsonPath}`, JSON.stringify(result.toJSON(), null, 2)),
        fs.writeFile(`${outdir}/${cssPath}`, css),
      ])
    }
  })

  ctx.logger.info('cli', `Found ${colors.bold(`${filesWithCss.length}/${files.length}`)} files using Panda`)
  measureTotal()
}
