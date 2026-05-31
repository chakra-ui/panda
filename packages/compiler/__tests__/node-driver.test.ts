import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createNodeDriver } from '../src'

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

    expect(driver.scan()).toMatchInlineSnapshot(`
      {
        "count": 1,
        "diagnostics": [],
      }
    `)
    expect(driver.compile().css).toContain('red')
  })

  it('writes artifacts under outdir via the engine fs, embedding the user transform', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.scan()

    const written = driver.writeArtifacts('styled-system')
    expect(written.some((path) => path.endsWith(join('patterns', 'stack.mjs')))).toBe(true)

    const stack = readFileSync(join(dir, 'styled-system', 'patterns', 'stack.mjs'), 'utf8')
    expect(stack).toContain('display: "flex"')
    expect(stack).not.toContain('(s) => s')
  })

  it('lists watch targets (source patterns, base dirs, config deps)', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    const targets = driver.watchTargets()

    expect(targets.sources).toMatchInlineSnapshot(`
      [
        "**/*.tsx",
      ]
    `)
    expect(targets.dirs).toEqual([dir])
    expect(targets.config).toContain('panda.config.ts')
  })

  it('exposes introspection over the current config', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    expect(driver.introspect.patterns()).toMatchInlineSnapshot(`
      [
        "stack",
      ]
    `)
    // cached handle
    expect(driver.introspect).toBe(driver.introspect)
  })

  it('applies a batch of source changes', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    const applied = driver.applyChanges([
      {
        path: join(dir, 'App.tsx'),
        kind: 'change',
        content: "import { css } from '@panda/css'; css({ color: 'blue' })",
      },
      {
        path: join(dir, 'Other.tsx'),
        kind: 'add',
        content: "import { css } from '@panda/css'; css({ color: 'green' })",
      },
    ])
    expect(applied).toMatchInlineSnapshot(`
      [
        true,
        true,
      ]
    `)
    expect(driver.compile().css).toContain('blue')
    expect(driver.compile().css).toContain('green')
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

    expect({ hasChanged: diff.hasChanged, dependencies: diff.dependencies, patterns: diff.patterns })
      .toMatchInlineSnapshot(`
        {
          "hasChanged": true,
          "dependencies": [
            "patterns",
          ],
          "patterns": [
            "stack",
          ],
        }
      `)
  })
})
