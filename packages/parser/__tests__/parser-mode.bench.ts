import { conditions, utilities } from '@pandacss/fixture'
import { allCssProperties } from '@pandacss/is-valid-prop'
import path from 'path'
import { bench, describe } from 'vitest'
import { loadConfigAndCreateContext } from '../../node'

const cwd = process.cwd()
const configPath = path.join(cwd, 'packages/cli/app/panda.config.ts')

describe('internal parser vs box-extractor', async () => {
  const ctx = await loadConfigAndCreateContext({ cwd, configPath })

  const properties = Array.from(
    new Set([
      'css',
      ...allCssProperties,
      ...Object.values(utilities).reduce((acc, prop) => {
        if (prop?.shorthand) {
          return acc.concat(prop.shorthand)
        }

        return acc
      }, [] as string[]),
      ...Object.keys(conditions),
    ]),
  )

  bench('internal', () => {
    ctx.getFiles().map((file) => ctx.project.parseSourceFile(file, properties, 'internal'))
  })

  bench('box-extractor', () => {
    ctx.getFiles().map((file) => ctx.project.parseSourceFile(file, properties, 'box-extractor'))
  })
})
