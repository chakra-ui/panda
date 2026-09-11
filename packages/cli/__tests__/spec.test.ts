import type { Spec } from '@pandacss/compiler-shared'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runSpec } from '../src'

function createSpecFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'panda-cli-spec-'))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `export default {
      outdir: 'styled-system',
      conditions: { hover: '&:hover' },
      theme: {
        tokens: { colors: { brand: { value: '#05f', description: 'Brand blue' } } },
        semanticTokens: { colors: { fg: { value: '{colors.brand}' } } },
        recipes: {
          button: {
            description: 'A button',
            variants: { size: { sm: { height: '8' } } },
            defaultVariants: { size: 'sm' },
          },
        },
      },
    }`,
  )
  return dir
}

function readSpec(dir: string, path = 'styled-system/specs/spec.json'): Spec {
  return JSON.parse(readFileSync(join(dir, path), 'utf8'))
}

describe('spec command', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  it('writes one versioned spec under the configured outdir', async () => {
    dir = createSpecFixture()

    const result = await runSpec({ cwd: dir, logLevel: 'silent' })

    expect(result.ok).toBe(true)
    expect(result.outfile).toBe(join(dir, 'styled-system', 'specs', 'spec.json'))
    expect(result.bytes).toBeGreaterThan(0)

    const spec = readSpec(dir)
    expect(spec.schemaVersion).toBe(1)
    expect(spec.catalog.conditions._hover).toBe('&:hover')
    expect(spec.catalog.tokens['colors.brand']).toMatchObject({
      path: 'colors.brand',
      semantic: false,
      values: [{ value: '#05f', description: 'Brand blue' }],
    })
    expect(spec.catalog.tokens['colors.fg']).toMatchObject({
      semantic: true,
      values: [{ value: 'var(--colors-brand)', originalValue: '{colors.brand}' }],
    })
    expect(spec.catalog.recipes.button).toMatchObject({
      name: 'button',
      description: 'A button',
      defaultVariants: { size: 'sm' },
    })
  })

  it('supports a custom output directory and minified JSON', async () => {
    dir = createSpecFixture()

    const result = await runSpec({ cwd: dir, outdir: 'artifacts', minify: true, logLevel: 'silent' })

    expect(result.ok).toBe(true)
    expect(existsSync(join(dir, 'artifacts', 'spec.json'))).toBe(true)
    expect(readFileSync(join(dir, 'artifacts', 'spec.json'), 'utf8')).not.toContain('\n  ')
    expect(readSpec(dir, 'artifacts/spec.json').schemaVersion).toBe(1)
  })
})
