// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  buildTokensSnapshot,
  createStudioRuntime,
  runStudioServe,
  semanticMapFromTokens,
  studioArtifactFiles,
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

const SAMPLE: StudioToken[] = [
  { category: 'colors', path: 'colors.red.500', name: 'red.500', value: '#ef4444' },
  { category: 'spacing', path: 'spacing.sm', name: 'sm', value: '8px' },
]

describe('studio snapshot', () => {
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

  it('keeps semantic paths out of the primitive list', () => {
    const specWithSemantic = {
      tokens: { categories: { colors: { values: ['bg'] } }, values: { 'colors.bg': 'var(--colors-white)' } },
    } as never
    const tokens = buildTokensSnapshot(specWithSemantic, { 'colors.bg': { base: '#fff' } })
    expect(tokens.filter((token) => token.path === 'colors.bg')).toHaveLength(1)
    expect(tokens[0].value).toBe('#fff')
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
})

describe('getTokenJson / getTokenHtml', () => {
  const runtime = createStudioRuntime(SAMPLE)

  it('filters by category and query', () => {
    expect(runtime.getTokenJson({ category: 'colors' })).toHaveLength(1)
    expect(runtime.getTokenJson({ query: '8px' })).toEqual([SAMPLE[1]])
    expect(runtime.getTokenJson()).toHaveLength(2)
  })

  it('renders semantic markup with no inline styles or shipped css', () => {
    const html = runtime.getTokenHtml({ category: 'colors' })
    expect(html).toContain('class="pds-token"')
    expect(html).toContain('data-value="#ef4444"')
    expect(html).toContain('red.500')
    expect(html).not.toContain('style=')
  })

  it('escapes untrusted token values', () => {
    const html = createStudioRuntime([
      { category: 'colors', path: 'colors.x', name: 'x', value: '"><script>alert(1)</script>' },
    ]).getTokenHtml()
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&quot;')
  })

  it('renders the tokens passed in, not the baked set', () => {
    const html = runtime.getTokenHtml({ tokens: [SAMPLE[1]] })
    expect(html).toContain('data-name="sm"')
    expect(html).not.toContain('red.500')
  })

  it('maps only color values to CSS variables, skipping unsafe values', () => {
    const css = createStudioRuntime([
      { category: 'colors', path: 'colors.red.500', name: 'red.500', value: '#ef4444' },
      { category: 'spacing', path: 'spacing.sm', name: 'sm', value: '8px' },
      { category: 'colors', path: 'colors.x', name: 'x', value: 'red;}body{display:none' },
    ]).getTokenCss()
    expect(css).toBe('[data-value="#ef4444"]{--pds-swatch:#ef4444}')
    expect(css).not.toContain('8px')
    expect(css).not.toContain('display:none')
  })
})

describe('styled-system/studio artifact', () => {
  it('emits a self-contained module + types', async () => {
    const files = studioArtifactFiles(SAMPLE)
    expect(files.map((f) => f.path)).toEqual(['studio/index.mjs', 'studio/index.d.ts'])

    const mod = await import(`data:text/javascript,${encodeURIComponent(files[0].code)}`)
    expect(mod.getTokenJson({ category: 'spacing' })).toEqual([SAMPLE[1]])
    expect(mod.getTokenHtml({ category: 'colors' })).toContain('data-value="#ef4444"')
    expect(mod.getTokenCss()).toContain('--pds-swatch:#ef4444')
  })
})

describe('panda studio', () => {
  let dir: string | undefined
  let stop: (() => Promise<void>) | undefined

  afterEach(async () => {
    await stop?.()
    stop = undefined
    cleanupFixture(dir)
    dir = undefined
  })

  it('emits styled-system/studio and server-renders the page', async () => {
    dir = createFixture(TOKEN_CONFIG)
    const result = await runStudioServe({ cwd: dir, host: '127.0.0.1', logLevel: 'silent' })
    stop = result.stop

    expect(result.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)

    const studioDir = join(dir, 'styled-system', 'studio')
    expect(existsSync(join(studioDir, 'index.mjs'))).toBe(true)
    expect(existsSync(join(studioDir, 'index.d.ts'))).toBe(true)

    const mod = await import(pathToFileURL(join(studioDir, 'index.mjs')).href)
    expect(mod.getTokenJson({ category: 'colors' }).some((t: StudioToken) => t.name === 'red.500')).toBe(true)

    const page = await (await fetch(`${result.url}/`)).text()
    expect(page).toContain('data-name="red.500"')
    expect(page).toContain('--pds-swatch:#ef4444')
  })

  it('resolves semantic conditions and named themes into the artifact', async () => {
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
    const result = await runStudioServe({ cwd: dir, host: '127.0.0.1', logLevel: 'silent' })
    stop = result.stop

    const mod = await import(pathToFileURL(join(dir, 'styled-system', 'studio', 'index.mjs')).href)
    const bg = mod.getTokenJson().find((t: StudioToken) => t.path === 'colors.bg')
    expect(bg.conditions).toEqual({ base: '#ef4444', _dark: '#3b82f6', 'ocean · base': '#e0f2fe' })
  })
})
