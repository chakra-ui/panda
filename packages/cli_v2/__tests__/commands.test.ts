import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runCodegen, runCssgen, runInspect, writeCssgenOutput } from '../src'

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
}
`

function createFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'panda-cli-v2-'))
  writeFileSync(join(dir, 'panda.config.ts'), CONFIG)
  writeFileSync(join(dir, 'App.tsx'), "import { css } from '@panda/css'; css({ color: 'red' })")
  return dir
}

describe('cli v2 command helpers', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  it('codegen writes styled-system files', async () => {
    dir = createFixture()
    const logs: string[] = []
    const result = await runCodegen({ cwd: dir }, { log: (message) => logs.push(message) })

    expect(result.files.some((path) => path.endsWith('css/css.mjs'))).toBe(true)
    expect(readFileSync(join(dir, 'styled-system', 'css', 'css.mjs'), 'utf8')).toContain('css')
    expect(logs[0]).toContain('codegen: wrote')
  })

  it('cssgen writes styles.css after parsing a css call', async () => {
    dir = createFixture()
    const result = await runCssgen({ cwd: dir, silent: true })

    expect(result.parsed).toHaveLength(1)
    expect(readFileSync(join(dir, 'styled-system', 'styles.css'), 'utf8')).toContain('red')
  })

  it('inspect returns stable json keys', async () => {
    dir = createFixture()
    const logs: string[] = []
    const result = await runInspect({ cwd: dir, json: true }, { log: (message) => logs.push(message) })

    expect(Object.keys(result)).toEqual([
      'configPath',
      'sourceCount',
      'watchDirs',
      'artifactIds',
      'conditionCount',
      'tokenCategoryCount',
      'utilityCount',
    ])
    expect(JSON.parse(logs[0])).toMatchObject({ sourceCount: 1 })
  })

  it('supports outdir and outfile overrides', async () => {
    dir = createFixture()
    await runCodegen({ cwd: dir, outdir: 'system', silent: true })
    await runCssgen({ cwd: dir, outfile: 'panda.css', silent: true })

    expect(readFileSync(join(dir, 'system', 'css', 'css.mjs'), 'utf8')).toContain('css')
    expect(readFileSync(join(dir, 'panda.css'), 'utf8')).toContain('red')
  })

  it('cssgen watch emission keeps previous styles when a source file changes', async () => {
    dir = createFixture()
    const appFile = join(dir, 'App.tsx')
    const stylesFile = join(dir, 'styled-system', 'styles.css')
    writeFileSync(appFile, "import { css } from '@panda/css'; css({ padding: '4px' })")

    const result = await runCssgen({ cwd: dir, silent: true })
    expect(result.parsed.map((report) => report.path)).toEqual([appFile])
    expect(result.driver.compiler.atoms().map((atom) => atom.value)).toEqual(['4px'])
    const parseFiles = vi.spyOn(result.driver, 'parseFiles')
    result.driver.applyChange({
      path: appFile,
      kind: 'change',
      content: "import { css } from '@panda/css'; css({ padding: '8px' })",
    })
    expect(
      result.driver.compiler
        .atoms()
        .map((atom) => atom.value)
        .sort(),
    ).toEqual(['4px', '8px'])
    await writeCssgenOutput(
      { driver: result.driver, cwd: dir, outdir: join(dir, 'styled-system'), output: { log: () => {} } },
      stylesFile,
      { cwd: dir, silent: true },
      result.parsed,
    )

    const css = readFileSync(stylesFile, 'utf8')

    expect(parseFiles).not.toHaveBeenCalled()
    expect(css).toContain('4px')
    expect(css).toContain('8px')
  })
})
