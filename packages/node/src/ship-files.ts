import { colors, logger, quote } from '@pandacss/logger'
import type { ExtractedDataItem } from '@pandacss/types'
import { mkdir, writeFile } from 'fs/promises'
import * as path from 'path'
import type { PandaContext } from './create-context'
import { createBox } from './cli-box'
import { outdent } from 'outdent'

export async function shipFiles(
  ctx: PandaContext,
  options: { outdir: string; minify?: boolean; pkgJson: PackageJson },
) {
  await mkdir(options.outdir, { recursive: true })

  const files = ctx.getFiles()

  const parserResultList = new Set<ExtractedDataItem>()
  const filesWithCss = [] as string[]

  files.forEach(async (file) => {
    const result = ctx.project.parseSourceFile(file)
    if (!result || result.isEmpty()) return

    const css = ctx.getParserCss(result)
    if (!css) return

    result.getAll().forEach(({ box, ...result }) => {
      parserResultList.add(result)
    })
    filesWithCss.push(path.relative(ctx.config.cwd, file))
  })

  logger.info('cli', `Found ${colors.bold(`${filesWithCss.length}/${files.length}`)} files using Panda`)

  const extractedPath = path.join(options.outdir, 'extracted.ast.json')
  const minify = options.minify ?? ctx.config.minify
  logger.info('cli', `Writing ${minify ? '[min] ' : ' '}${colors.bold(`${extractedPath}`)}`)

  await writeFile(
    `${extractedPath}`,
    JSON.stringify(
      {
        name: options.pkgJson.name,
        version: options.pkgJson.version,
        files: filesWithCss,
        ast: Array.from(parserResultList),
      },
      null,
      minify ? 0 : 2,
    ),
  )

  const relativeOutdir = path.relative(ctx.config.cwd, options.outdir)
  logger.log(
    createBox({
      content: outdent`

    ${colors.bold().cyan('Next step:')}

    Create (or add to) your ${quote('preset.ts')} file the vendor CSS that just got generated:

      import { definePreset } from "@pandacss/dev";
      import { ExtractedData } from "@pandacss/types";
      import extracted from "../${relativeOutdir}/ship/extracted.ast.json" assert { type: "json" };

      export const libPreset = definePreset({
        vendorsCss: [extracted as unknown as ExtractedData],
      });
    `,
      title: `🐼 Congratulations ! ✨`,
    }),
  )
}

type PackageJson = {
  name: string
  version: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}
