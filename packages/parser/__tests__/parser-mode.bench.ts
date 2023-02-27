import path from 'path'
import { bench, describe } from 'vitest'
import { loadConfigAndCreateContext } from '../../node'

const cwd = process.cwd()
const configPath = path.join(cwd, 'packages/cli/app/panda.config.ts')

describe('internal parser vs box-extractor', async () => {
  const ctx = await loadConfigAndCreateContext({ cwd, configPath })

  bench('internal', () => {
    ctx.getFiles().map((file) => ctx.project.parseSourceFile(file, 'internal'))
  })

  bench('box-extractor', () => {
    ctx.getFiles().map((file) => ctx.project.parseSourceFile(file, 'box-extractor'))
  })
})
