import { colors, logger, quote } from '@pandacss/logger'
import type { ResultItem } from '@pandacss/types'
import { mkdir, writeFile } from 'fs/promises'
import * as path from 'path'
import type { PandaContext } from './create-context'
import { Node } from 'ts-morph'
import { getNodeRange } from './get-node-range'
import { createBox } from './cli-box'
import { outdent } from 'outdent'

export async function shipFiles(ctx: PandaContext, options: { outdir: string; pkgJson: PackageJson }) {
  await mkdir(options.outdir, { recursive: true })

  const files = ctx.getFiles()

  const parserResultList = new Set<ResultItem>()
  const filesWithCss = [] as string[]

  files.forEach(async (file) => {
    const result = ctx.project.parseSourceFile(file)
    if (!result || result.isEmpty()) return

    const css = ctx.getParserCss(result)
    if (!css) return

    result.getAll().forEach((result) => {
      parserResultList.add(result)
    })
    filesWithCss.push(path.relative(ctx.config.cwd, file))
  })

  logger.info('cli', `Found ${colors.bold(`${filesWithCss.length}/${files.length}`)} files using Panda`)

  const extractedPath = path.join(options.outdir, 'extracted.ast.json')
  logger.info('cli', `Writing ${colors.bold(`${extractedPath}`)}`)
  await writeFile(
    `${extractedPath}`,
    JSON.stringify(
      { name: options.pkgJson.name, version: options.pkgJson.version, files: filesWithCss, ast: parserResultList },
      shipResultSerializer,
      2,
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
      title: `🐼 Congralutations ! ✨`,
    }),
  )
}

const shipResultSerializer = (_key: string, value: any) => {
  if (value instanceof Set) {
    return Array.from(value)
  }

  if (value instanceof Map) {
    return Object.fromEntries(value)
  }

  if (Node.isNode(value)) {
    return { kind: value.getKindName(), range: getNodeRange(value) }
  }

  return value
}

type PackageJson = {
  name: string
  version: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}
