import { bench, describe } from 'vitest'
import { loadConfigAndCreateContext } from '../src/config'
import { createParserResult } from '@pandacss/parser'
import { join } from 'path'

describe('parser', async () => {
  const ctx = await loadConfigAndCreateContext({
    cwd: join(process.cwd(), 'website'),
    configPath: 'panda.config.ts',
  })

  const files = ctx.getFiles()

  bench(
    'parse - old',
    () => {
      const collector = createParserResult(ctx.parserOptions)
      const cssFiles = [] as string[]

      files.forEach(async (file) => {
        const result = ctx.project.parseSourceFile(file)
        if (!result || result.isEmpty()) return

        const css = ctx.getParserCssOld(result)
        if (!css) return

        collector.merge(result)
        cssFiles.push(css)
      })

      const output = ctx.getCss({ files: cssFiles, resolve: false })
    },
    { iterations: 50 },
  )
  bench(
    'parse - new',
    () => {
      const collector = createParserResult(ctx.parserOptions)
      files.forEach(async (file) => {
        const result = ctx.project.parseSourceFile(file)

        if (!result || result.isEmpty()) return

        collector.mergeStyles(result)
      })

      const css = ctx.getParserCss(collector)
      const output = ctx.getCss({ files: [css ?? ''], resolve: false })
    },
    { iterations: 50 },
  )
})
