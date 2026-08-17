// @vitest-environment node
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
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

  it('orders a category by value so bars read as a top-to-bottom meter, negatives last', () => {
    const html = createStudioRuntime([
      { category: 'spacing', path: 'spacing.10', name: '10', value: '2.5rem' },
      { category: 'spacing', path: 'spacing.-4', name: '-4', value: '-1rem' },
      { category: 'spacing', path: 'spacing.1', name: '1', value: '0.25rem' },
      { category: 'spacing', path: 'spacing.2', name: '2', value: '0.5rem' },
    ]).getTokenHtml({ category: 'spacing' })
    expect(html.indexOf('data-name="1"')).toBeLessThan(html.indexOf('data-name="2"'))
    expect(html.indexOf('data-name="2"')).toBeLessThan(html.indexOf('data-name="10"'))
    expect(html.indexOf('data-name="10"')).toBeLessThan(html.indexOf('data-name="-4"'))
  })

  it('orders sizes by real length across units, so ch lands by its px width', () => {
    const html = createStudioRuntime([
      { category: 'sizes', path: 'sizes.a', name: 'a', value: '40rem' },
      { category: 'sizes', path: 'sizes.prose', name: 'prose', value: '60ch' },
      { category: 'sizes', path: 'sizes.b', name: 'b', value: '20rem' },
    ]).getTokenHtml({ category: 'sizes' })
    expect(html.indexOf('data-name="b"')).toBeLessThan(html.indexOf('data-name="prose"'))
    expect(html.indexOf('data-name="prose"')).toBeLessThan(html.indexOf('data-name="a"'))
  })

  it('keeps naturally-negative scales (letterSpacings) ascending, not pushed last', () => {
    const html = createStudioRuntime([
      { category: 'letterSpacings', path: 'letterSpacings.normal', name: 'normal', value: '0em' },
      { category: 'letterSpacings', path: 'letterSpacings.tighter', name: 'tighter', value: '-0.05em' },
      { category: 'letterSpacings', path: 'letterSpacings.wide', name: 'wide', value: '0.025em' },
    ]).getTokenHtml({ category: 'letterSpacings' })
    expect(html.indexOf('data-name="tighter"')).toBeLessThan(html.indexOf('data-name="normal"'))
    expect(html.indexOf('data-name="normal"')).toBeLessThan(html.indexOf('data-name="wide"'))
  })

  it('renders the tokens passed in, not the baked set', () => {
    const html = runtime.getTokenHtml({ tokens: [SAMPLE[1]] })
    expect(html).toContain('data-name="sm"')
    expect(html).not.toContain('red.500')
  })

  it('maps token values to CSS variables and appends the given stylesheet', () => {
    const rt = createStudioRuntime([
      { category: 'colors', path: 'colors.red.500', name: 'red.500', value: '#ef4444' },
      { category: 'spacing', path: 'spacing.sm', name: 'sm', value: '8px' },
      { category: 'colors', path: 'colors.x', name: 'x', value: 'red;}body{display:none' },
    ])
    const css = rt.getTokenCss('.pds-token{border:1px solid}')
    expect(css).toContain('[data-value="#ef4444"]{--pds-value:#ef4444}')
    expect(css).toContain('[data-value="8px"]{--pds-value:8px}')
    expect(css).not.toContain('display:none')
    expect(css.endsWith('.pds-token{border:1px solid}')).toBe(true)
  })
})

describe('styled-system/studio artifact', () => {
  it('emits a self-contained module + types', async () => {
    const files = studioArtifactFiles(SAMPLE)
    expect(files.map((f) => f.path)).toEqual(['studio/index.mjs', 'studio/index.d.ts'])

    const mod = await import(`data:text/javascript,${encodeURIComponent(files[0].code)}`)
    expect(mod.getTokenJson({ category: 'spacing' })).toEqual([SAMPLE[1]])
    expect(mod.getTokenHtml({ category: 'colors' })).toContain('data-value="#ef4444"')
    expect(mod.getTokenCss()).toContain('--pds-value:#ef4444')
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
    expect(page).toContain('--pds-value:#ef4444')
    expect(page).toContain('grid-template-columns')
  })

  it('renders the viewer with a user stylesheet appended after the default', async () => {
    dir = createFixture(TOKEN_CONFIG)
    writeFileSync(join(dir, 'studio.css'), '.pds-token{outline:2px dashed hotpink}')
    const result = await runStudioServe({ cwd: dir, host: '127.0.0.1', css: 'studio.css', logLevel: 'silent' })
    stop = result.stop

    const page = await (await fetch(`${result.url}/`)).text()
    expect(page).toContain('grid-template-columns')
    expect(page).toContain('.pds-token{outline:2px dashed hotpink}')
    expect(page.indexOf('grid-template-columns')).toBeLessThan(page.indexOf('outline:2px dashed hotpink'))
    expect(page).toContain('--pds-value:#ef4444')
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
