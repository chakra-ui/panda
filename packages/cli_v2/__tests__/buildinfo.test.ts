import { createNodeDriver, type BuildInfo } from '@pandacss/compiler'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runBuildinfo } from '../src'
import { CONFIG } from './helpers'

/** A two-component "library" fixture: each module emits a distinct utility. */
function createLibFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'panda-cli-v2-lib-'))
  writeFileSync(join(dir, 'panda.config.ts'), CONFIG)
  writeFileSync(join(dir, 'button.tsx'), "import { css } from '@panda/css'; css({ color: 'red' })")
  writeFileSync(join(dir, 'card.tsx'), "import { css } from '@panda/css'; css({ background: 'blue' })")
  return dir
}

function readBuildInfo(dir: string, outfile = 'styled-system/panda.buildinfo.json'): BuildInfo {
  return JSON.parse(readFileSync(join(dir, outfile), 'utf8'))
}

describe('buildinfo command', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  // --- Produce artifact ---

  it('writes panda.buildinfo.json with interned atoms + cwd-relative module keys', async () => {
    dir = createLibFixture()

    const result = await runBuildinfo({ cwd: dir, silent: true, panda: '^2.0.0' })

    expect(result.ok).toBe(true)
    expect(existsSync(join(dir, 'styled-system', 'panda.buildinfo.json'))).toBe(true)

    // `configFingerprint` excludes machine-local paths, so the artifact is
    // identical across checkouts — safe to assert inline. Module keys are portable.
    expect(readBuildInfo(dir)).toMatchInlineSnapshot(`
      {
        "atoms": [
          {
            "p": 0,
            "v": 1,
          },
          {
            "p": 2,
            "v": 3,
          },
        ],
        "configFingerprint": "cfg1-b849248732ef028b",
        "modules": {
          "button.tsx": {
            "atoms": [
              1,
            ],
          },
          "card.tsx": {
            "atoms": [
              0,
            ],
          },
        },
        "panda": "^2.0.0",
        "schemaVersion": 3,
        "strings": [
          "background",
          "blue",
          "color",
          "red",
        ],
      }
    `)
  })

  it('tracks exports of recipe-consuming components with portable module keys', async () => {
    dir = mkdtempSync(join(tmpdir(), 'panda-cli-v2-lib-'))
    writeFileSync(
      join(dir, 'panda.config.ts'),
      `export default {
        outdir: 'styled-system',
        include: ['**/*.tsx'],
        importMap: { css: ['@panda/css'], recipe: ['@panda/recipes'], pattern: ['@panda/patterns'], jsx: ['@panda/jsx'], tokens: ['@panda/tokens'] },
        theme: { recipes: { button: { jsx: ['Button'], base: { display: 'inline-flex' } } } },
      }`,
    )
    writeFileSync(
      join(dir, 'button.tsx'),
      "import { Button } from './ui'\nexport function ActionButton() { return <Button /> }",
    )

    await runBuildinfo({ cwd: dir, silent: true })

    const info = readBuildInfo(dir)
    // The export maps to a portable (cwd-relative) module key, not an abs path.
    expect(info.exports).toEqual({ ActionButton: 'button.tsx' })
    expect(info.modules['button.tsx']?.recipes?.length).toBeGreaterThan(0)
  })

  // --- Consume artifact (full + tree-shaken) ---

  it('hydrating the produced artifact reproduces the CSS (full round-trip)', async () => {
    dir = createLibFixture()
    await runBuildinfo({ cwd: dir, silent: true })
    const info = readBuildInfo(dir)

    // A fresh, empty consumer compiler hydrates the whole library.
    const consumer = await createNodeDriver({ cwd: dir })
    const applied = consumer.compiler.buildInfo.hydrate(info, { name: '@acme/ds' })

    expect(applied).toMatchInlineSnapshot(`
      {
        "modules": [
          "button.tsx",
          "card.tsx",
        ],
        "ok": true,
      }
    `)
    expect(consumer.compiler.layerCss(['utilities'])).toMatchInlineSnapshot(`
      "@layer utilities {
        .background_blue {
          background: blue;
        }
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  it('tree-shakes to the imported module', async () => {
    dir = createLibFixture()
    await runBuildinfo({ cwd: dir, silent: true })
    const info = readBuildInfo(dir)

    const consumer = await createNodeDriver({ cwd: dir })
    const applied = consumer.compiler.buildInfo.hydrate(info, { name: '@acme/ds', only: ['button.tsx'] })

    expect(applied.modules).toEqual(['button.tsx'])
    // button's `color: red` hydrated; card's `background: blue` tree-shaken out.
    expect(consumer.compiler.layerCss(['utilities'])).toMatchInlineSnapshot(`
      "@layer utilities {
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  it('reports a portable summary of what it wrote', async () => {
    dir = createLibFixture()

    const result = await runBuildinfo({ cwd: dir, silent: true })

    expect({
      ok: result.ok,
      moduleCount: result.moduleCount,
      atomCount: result.atomCount,
      recipeCount: result.recipeCount,
    }).toMatchInlineSnapshot(`
      {
        "atomCount": 2,
        "moduleCount": 2,
        "ok": true,
        "recipeCount": 0,
      }
    `)
  })

  // --- CLI flags + error paths ---

  it('honors --outfile and --minify', async () => {
    dir = createLibFixture()

    const result = await runBuildinfo({ cwd: dir, silent: true, outfile: 'dist/bi.json', minify: true })

    expect(existsSync(join(dir, 'dist', 'bi.json'))).toBe(true)
    const raw = readFileSync(join(dir, 'dist', 'bi.json'), 'utf8')
    expect(raw).not.toContain('\n')
    expect(result.bytes).toBe(Buffer.byteLength(raw))
  })

  it('reports a missing-config diagnostic without writing', async () => {
    dir = mkdtempSync(join(tmpdir(), 'panda-cli-v2-lib-'))

    const result = await runBuildinfo({ cwd: dir, silent: true })

    expect(result.ok).toBe(false)
    expect(result.diagnostics.map(({ code, severity }) => ({ code, severity }))).toMatchInlineSnapshot(`
      [
        {
          "code": "config_load_error",
          "severity": "error",
        },
      ]
    `)
    expect(existsSync(join(dir, 'styled-system', 'panda.buildinfo.json'))).toBe(false)
  })
})
