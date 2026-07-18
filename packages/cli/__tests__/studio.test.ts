import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  buildSemanticMap,
  buildTokensSnapshot,
  runStudioGenerate,
  runStudioServe,
  viewFiles,
  viewerFiles,
} from '../src'
import type { StudioToken } from '../src'
import { cleanupFixture, createFixture } from './helpers'

const TOKEN_CONFIG = `export default {
  outdir: 'styled-system',
  include: ['**/*.tsx'],
  jsxFramework: 'react',
  theme: {
    tokens: {
      colors: { red: { 500: { value: '#ef4444' } }, blue: { 500: { value: '#3b82f6' } } },
      spacing: { sm: { value: '8px' } },
      radii: { md: { value: '6px' } },
    },
  },
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
}
`

const SOLID_CONFIG = TOKEN_CONFIG.replace("jsxFramework: 'react'", "jsxFramework: 'solid'")

const SAMPLE: StudioToken[] = [{ category: 'colors', path: 'colors.red.500', name: 'red.500', value: '#ef4444' }]

describe('studio generate', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('flattens the token spec into a snapshot', () => {
    const files = viewFiles(SAMPLE, 'react')
    const snapshot = JSON.parse(files.find((file) => file.path === 'tokens.json')!.code)
    expect(snapshot).toEqual(SAMPLE)
  })

  it('builds a snapshot from a spec, skipping empty values', () => {
    const spec = {
      tokens: {
        categories: { colors: { values: ['red.500', 'blank'] } },
        values: { 'colors.red.500': '#ef4444', 'colors.blank': '' },
      },
    } as never
    expect(buildTokensSnapshot(spec)).toEqual([
      { category: 'colors', path: 'colors.red.500', name: 'red.500', value: '#ef4444' },
    ])
  })

  it('writes React views + tokens.json to the default outdir', async () => {
    dir = createFixture(TOKEN_CONFIG)

    const logs: string[] = []
    const result = await runStudioGenerate({ cwd: dir }, { log: (message) => logs.push(message) })

    const studioDir = join(dir, 'styled-system', 'studio')
    expect(result.framework).toBe('react')
    expect(existsSync(join(studioDir, 'Colors.tsx'))).toBe(true)
    expect(existsSync(join(studioDir, 'components', 'token-grid.tsx'))).toBe(true)

    const snapshot = JSON.parse(readFileSync(join(studioDir, 'tokens.json'), 'utf8'))
    expect(snapshot).toContainEqual({ category: 'colors', path: 'colors.red.500', name: 'red.500', value: '#ef4444' })

    const grid = readFileSync(join(studioDir, 'components', 'token-grid.tsx'), 'utf8')
    expect(grid).toContain("from 'react'")
    expect(logs[0]).toContain('studio: wrote')
  })

  it('honours --outdir', async () => {
    dir = createFixture(TOKEN_CONFIG)

    await runStudioGenerate({ cwd: dir, outdir: '.storybook/studio', logLevel: 'silent' })

    expect(existsSync(join(dir, '.storybook', 'studio', 'Colors.tsx'))).toBe(true)
  })

  it('emits Solid source when jsxFramework is solid', async () => {
    dir = createFixture(SOLID_CONFIG)

    const result = await runStudioGenerate({ cwd: dir, logLevel: 'silent' })
    expect(result.framework).toBe('solid')

    const grid = readFileSync(join(dir, 'styled-system', 'studio', 'components', 'token-grid.tsx'), 'utf8')
    expect(grid).toContain("from 'solid-js'")
    expect(grid).toContain('<For')
  })
})

describe('studio viewer', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('emits a self-contained vanilla bundle, one page per section', () => {
    const paths = viewerFiles(SAMPLE).map((file) => file.path)
    expect(paths).toEqual(['tokens.json', 'studio.css', 'studio.js', 'index.html', 'contrast.html'])
  })

  it('serves tokens.json over http', async () => {
    dir = createFixture(TOKEN_CONFIG)

    const result = await runStudioServe({ cwd: dir, host: '127.0.0.1', logLevel: 'silent' })
    try {
      expect(result.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)

      const res = await fetch(`${result.url}/tokens.json`)
      const snapshot = await res.json()
      expect(snapshot).toContainEqual({
        category: 'colors',
        path: 'colors.red.500',
        name: 'red.500',
        value: '#ef4444',
      })

      const page = await fetch(`${result.url}/`)
      expect(await page.text()).toContain('Panda Studio')
    } finally {
      await result.stop?.()
    }
  })
})

describe('studio semantic tokens', () => {
  const spec = { tokens: { categories: {}, values: { 'colors.white': '#fff', 'colors.black': '#000' } } } as never
  const config = {
    theme: { semanticTokens: { colors: { bg: { value: { base: '{colors.white}', _dark: '{colors.black}' } } } } },
    themes: { ocean: { semanticTokens: { colors: { bg: { value: { base: '#e0f2fe' } } } } } },
  }

  it('resolves semantic conditions and named themes against token values', () => {
    expect(buildSemanticMap(spec, config)).toEqual({
      'colors.bg': { base: '#fff', _dark: '#000', 'ocean · base': '#e0f2fe' },
    })
  })

  it('flattens nested conditions with colon-joined keys, matching the compiler', () => {
    const nested = {
      theme: {
        semanticTokens: {
          colors: {
            brand: { value: { base: '{colors.white}', _dark: { base: '{colors.black}', _sunset: '{colors.white}' } } },
          },
        },
      },
    }
    expect(buildSemanticMap(spec, nested)).toEqual({
      'colors.brand': { base: '#fff', '_dark:base': '#000', '_dark:_sunset': '#fff' },
    })
  })

  it('emits semantic tokens with conditions, base as the display value', () => {
    const semantic = buildSemanticMap(spec, config)
    const tokens = buildTokensSnapshot(spec, semantic)
    const bg = tokens.find((token) => token.path === 'colors.bg')
    expect(bg).toMatchObject({ category: 'colors', name: 'bg', value: '#fff' })
    expect(bg?.conditions).toEqual({ base: '#fff', _dark: '#000', 'ocean · base': '#e0f2fe' })
  })

  it('keeps semantic paths out of the primitive list', () => {
    const specWithSemantic = {
      tokens: { categories: { colors: { values: ['bg'] } }, values: { 'colors.bg': 'var(--colors-white)' } },
    } as never
    const tokens = buildTokensSnapshot(specWithSemantic, { 'colors.bg': { base: '#fff' } })
    expect(tokens.filter((token) => token.path === 'colors.bg')).toHaveLength(1)
    expect(tokens[0].value).toBe('#fff')
  })
})
