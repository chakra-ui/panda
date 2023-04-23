import { colors, logger } from '@pandacss/logger'
import { mkdir, writeFile } from 'fs/promises'
import type { PandaContext } from './create-context'
import { getNodeRange } from './get-node-range'
import * as path from 'path'

export async function debugFiles(ctx: PandaContext, options: { outdir: string; dry: boolean }) {
  const files = ctx.getFiles()
  const measureTotal = logger.time.debug(`Done parsing ${files.length} files`)

  // easier to debug
  ctx.config.minify = false

  if (!options.dry && options.outdir) {
    await mkdir(options.outdir, { recursive: true })
  }

  const filesWithCss = []
  await files.map(async (file) => {
    const measure = logger.time.debug(`Parsed ${file}`)
    const result = ctx.project.parseSourceFile(file)

    measure()
    if (!result) return

    const list = result.getAll().map((result) => {
      const node = result.box.getNode()
      const range = getNodeRange(node)

      return {
        name: result.name,
        type: result.type,
        data: result.data,
        kind: node.getKindName(),
        line: range.startLineNumber,
        column: range.startColumn,
      }
    })
    const css = ctx.getParserCss(result)
    if (!css) return

    if (options.dry) {
      console.log({ path: file, ast: list, code: css })
      return Promise.resolve()
    }

    if (options.outdir) {
      filesWithCss.push(file)
      const parsedPath = path.parse(file)
      const relative = path.relative(ctx.config.cwd, parsedPath.dir)

      const astJsonPath = `${relative}/${parsedPath.name}.ast.json`.replaceAll(path.sep, '__')
      const cssPath = `${relative}/${parsedPath.name}.css`.replaceAll(path.sep, '__')

      logger.info('cli', `Writing ${colors.bold(`${options.outdir}/${astJsonPath}`)}`)
      logger.info('cli', `Writing ${colors.bold(`${options.outdir}/${cssPath}`)}`)

      return Promise.all([
        writeFile(`${options.outdir}/${astJsonPath}`, JSON.stringify(list, debugResultSerializer, 2)),
        writeFile(`${options.outdir}/${cssPath}`, css),
      ])
    }
  })

  logger.info('cli', `Found ${colors.bold(`${filesWithCss.length}/${files.length}`)} files using Panda`)
  measureTotal()
}

const debugResultSerializer = (_key: string, value: any) => {
  if (value instanceof Set) {
    return Array.from(value)
  }

  if (value instanceof Map) {
    return Object.fromEntries(value)
  }

  return value
}
