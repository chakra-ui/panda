// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  buildTokensSnapshot,
  runStudioGenerate,
  runStudioServe,
  semanticMapFromTokens,
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
    expect(existsSync(join(studioDir, 'colors.tsx'))).toBe(true)
    expect(existsSync(join(studioDir, 'token-grid.tsx'))).toBe(true)
    expect(existsSync(join(studioDir, 'studio.css'))).toBe(true)
    expect(existsSync(join(studioDir, 'helpers.ts'))).toBe(true)

    const snapshot = JSON.parse(readFileSync(join(studioDir, 'tokens.json'), 'utf8'))
    expect(snapshot).toContainEqual({ category: 'colors', path: 'colors.red.500', name: 'red.500', value: '#ef4444' })

    const grid = readFileSync(join(studioDir, 'token-grid.tsx'), 'utf8')
    expect(grid).toContain("from 'react'")
    expect(grid).toContain("import css from './studio.css?raw'")
    expect(logs[0]).toContain('studio: wrote')
  })

  it('emits keyframe CSS from the compiler into studio.css', async () => {
    const config = TOKEN_CONFIG.replace(
      'tokens: {',
      "keyframes: { spin: { to: { transform: 'rotate(360deg)' } } },\n    tokens: {",
    )
    dir = createFixture(config)

    await runStudioGenerate({ cwd: dir, logLevel: 'silent' })

    const css = readFileSync(join(dir, 'styled-system', 'studio', 'studio.css'), 'utf8')
    expect(css).toContain('@keyframes spin')
    expect(css).toContain('rotate(360deg)')
  })

  it('honours --outdir', async () => {
    dir = createFixture(TOKEN_CONFIG)

    await runStudioGenerate({ cwd: dir, outdir: '.storybook/studio', logLevel: 'silent' })

    expect(existsSync(join(dir, '.storybook', 'studio', 'colors.tsx'))).toBe(true)
  })

  it('emits Solid source when jsxFramework is solid', async () => {
    dir = createFixture(SOLID_CONFIG)

    const result = await runStudioGenerate({ cwd: dir, logLevel: 'silent' })
    expect(result.framework).toBe('solid')

    const grid = readFileSync(join(dir, 'styled-system', 'studio', 'token-grid.tsx'), 'utf8')
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

  it('emits one semantic page per category present, not a single semantic view', () => {
    const tokens: StudioToken[] = [
      ...SAMPLE,
      { category: 'colors', path: 'colors.bg', name: 'bg', value: '#fff', conditions: { base: '#fff', _dark: '#000' } },
      { category: 'fonts', path: 'fonts.body', name: 'body', value: 'sans', conditions: { base: 'sans' } },
    ]
    const paths = viewerFiles(tokens).map((file) => file.path)
    expect(paths).toContain('semantic-colors.html')
    expect(paths).toContain('semantic-fonts.html')
    expect(paths).not.toContain('semantic.html')
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

describe('studio fonts', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('emits @font-face css from the compiler so the viewer loads the user font', async () => {
    const config = TOKEN_CONFIG.replace(
      'export default {',
      `export default {
  globalFontface: { Custom: { src: "url('/fonts/custom.woff2') format('woff2')", fontDisplay: 'swap' } },`,
    )
    dir = createFixture(config)

    await runStudioGenerate({ cwd: dir, logLevel: 'silent' })

    const css = readFileSync(join(dir, 'styled-system', 'studio', 'studio.css'), 'utf8')
    expect(css).toContain('@font-face')
    expect(css).toContain('font-family: Custom')
    expect(css).toContain("url('/fonts/custom.woff2') format('woff2')")
    expect(css).toContain('font-display: swap')
  })
})

describe('studio semantic tokens', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('labels base-theme and named-theme conditions from the compiler projection', () => {
    const map = semanticMapFromTokens([
      {
        path: 'colors.bg',
        conditions: [
          { condition: 'base', value: '#fff' },
          { condition: '_dark', value: '#000' },
          { theme: 'ocean', condition: 'base', value: '#e0f2fe' },
        ],
      },
    ])
    expect(map).toEqual({ 'colors.bg': { base: '#fff', _dark: '#000', 'ocean · base': '#e0f2fe' } })
  })

  it('resolves semantic conditions and named themes end to end through the compiler', async () => {
    const config = TOKEN_CONFIG.replace(
      'theme: {',
      `theme: {
    semanticTokens: { colors: { bg: { value: { base: '{colors.red.500}', _dark: '{colors.blue.500}' } } } },`,
    ).replace(
      'export default {',
      `export default {
  themes: { ocean: { semanticTokens: { colors: { bg: { value: { base: '#e0f2fe' } } } } } },`,
    )
    dir = createFixture(config)

    await runStudioGenerate({ cwd: dir, logLevel: 'silent' })

    const snapshot = JSON.parse(readFileSync(join(dir, 'styled-system', 'studio', 'tokens.json'), 'utf8'))
    const bg = snapshot.find((token: StudioToken) => token.path === 'colors.bg')
    expect(bg).toMatchObject({ category: 'colors', name: 'bg', value: '#ef4444' })
    expect(bg.conditions).toEqual({ base: '#ef4444', _dark: '#3b82f6', 'ocean · base': '#e0f2fe' })
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
