import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createNodeDriver, writeArtifacts } from '../src'

const CONFIG = `export default {
  outdir: 'styled-system',
  include: ['**/*.tsx'],
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
  patterns: {
    stack: {
      properties: { gap: {} },
      defaultValues: { gap: '4' },
      transform(props) {
        return { display: 'flex', gap: props.gap }
      },
    },
  },
}
`

describe('createNodeDriver', () => {
  let dir: string

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'panda-driver-'))
    writeFileSync(join(dir, 'panda.config.ts'), CONFIG)
    writeFileSync(join(dir, 'App.tsx'), "import { css } from '@panda/css'; css({ color: 'red' })")
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('scans the project via the fs engine and compiles the stylesheet', async () => {
    const driver = await createNodeDriver({ cwd: dir })

    const report = driver.scan()
    expect(report.count).toBe(1)
    expect(report.diagnostics).toEqual([])

    const css = driver.compile().css
    expect(css).toContain('red')
  })

  it('generates artifacts embedding the user pattern transform, written under outdir', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.scan()

    const written = await writeArtifacts(driver.artifacts(), { outdir: 'styled-system', cwd: dir })
    expect(written.some((path) => path.endsWith(join('patterns', 'stack.mjs')))).toBe(true)

    const stack = readFileSync(join(dir, 'styled-system', 'patterns', 'stack.mjs'), 'utf8')
    expect(stack).toContain('display: "flex"')
    expect(stack).not.toContain('(s) => s')
  })

  it('lists watch targets (sources + config deps)', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    const targets = driver.watchTargets()

    expect(targets.sources.length).toBe(1)
    expect(targets.config).toContain('panda.config.ts')
  })
})

describe('createNodeDriver reload', () => {
  let dir: string

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'panda-driver-reload-'))
    writeFileSync(join(dir, 'panda.config.ts'), CONFIG)
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns a non-empty diff after a config edit', async () => {
    const driver = await createNodeDriver({ cwd: dir })

    writeFileSync(
      join(dir, 'panda.config.ts'),
      CONFIG.replace("defaultValues: { gap: '4' }", "defaultValues: { gap: '8' }"),
    )
    const diff = await driver.reload()

    expect(diff.hasChanged).toBe(true)
    expect(diff.dependencies).toContain('patterns')
    expect(diff.patterns).toContain('stack')
  })
})
