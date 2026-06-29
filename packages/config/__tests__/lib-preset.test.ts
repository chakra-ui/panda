import { execFileSync } from 'node:child_process'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { compilePreset } from '../src/lib-preset'

describe('compilePreset', () => {
  let dir: string

  beforeAll(() => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-lib-preset-')))
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  test('strips app/parent fields and keeps preset additions including functions', async () => {
    const file = join(dir, 'panda.config.ts')
    writeFileSync(
      file,
      `export default {
        designSystem: '@acme/foundations',
        include: ['./src/**/*.tsx'],
        outdir: 'styled-system',
        importMap: '@acme/ds',
        theme: { tokens: { colors: { brand: { value: '#f00' } } } },
        utilities: { mx: { transform: (v) => ({ marginLeft: v, marginRight: v }) } },
      }`,
    )

    const { code } = await compilePreset(file, dir)
    const out = join(dir, 'preset.mjs')
    writeFileSync(out, code)

    const probe = join(dir, 'probe.mjs')
    writeFileSync(
      probe,
      `import preset from ${JSON.stringify(pathToFileURL(out).href)}
const out = {
  designSystem: preset.designSystem,
  include: preset.include,
  outdir: preset.outdir,
  importMap: preset.importMap,
  brand: preset.theme.tokens.colors.brand.value,
  transformType: typeof preset.utilities.mx.transform,
  transformResult: preset.utilities.mx.transform(4),
}
process.stdout.write(JSON.stringify(out))
`,
    )

    const result = JSON.parse(execFileSync('node', [probe], { encoding: 'utf8' }))
    expect(result.designSystem).toBeUndefined()
    expect(result.include).toBeUndefined()
    expect(result.outdir).toBeUndefined()
    expect(result.importMap).toBeUndefined()
    expect(result.brand).toBe('#f00')
    expect(result.transformType).toBe('function')
    expect(result.transformResult).toEqual({ marginLeft: 4, marginRight: 4 })
  })
})
