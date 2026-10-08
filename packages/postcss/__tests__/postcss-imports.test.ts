import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import postcss, { type Root } from 'postcss'
import { build, createServer, type Rollup } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'
import pandacss from '../src'

const FIXTURE = join(__dirname, 'fixtures/imported-assets')
const ENTRY = join(FIXTURE, 'src/index.css')
const FONTS = join(FIXTURE, 'src/lib/fonts.css')
const LAYER_ORDER = '@layer reset, base, tokens, recipes, utilities;'

const outRoot = realpathSync(mkdtempSync(join(tmpdir(), 'panda-postcss-imports-')))
afterAll(() => rmSync(outRoot, { recursive: true, force: true }))

function plugin(polyfill: boolean) {
  return pandacss({
    cwd: FIXTURE,
    configPath: polyfill ? 'panda.config.ts' : 'panda.no-polyfill.config.ts',
    outdir: join(outRoot, polyfill ? 'styled-system' : 'styled-system-no-polyfill'),
  })
}

// Like postcss-import: inlined rules keep their own source file.
function inlinedEntry(entry: string, imported: string) {
  const root = postcss.parse(entry, { from: ENTRY })
  root.append(postcss.parse(imported, { from: FONTS }).nodes)
  return root
}

function sourceFiles(root: Root) {
  return root.nodes.map(
    (node) =>
      `${node.type === 'atrule' ? `@${node.name}` : node.type} ← ${node.source?.input.file?.replace(FIXTURE, '')}`,
  )
}

function urls(css: string) {
  return css.match(/url\([^)]*\)/g)?.map((url) => url.replace(/-[\w-]{8}\./, '-[hash].'))
}

async function viteBuild(polyfill: boolean) {
  const output = (await build({
    root: FIXTURE,
    configFile: false,
    logLevel: 'silent',
    css: { postcss: { plugins: [plugin(polyfill)] } },
    build: { write: false, assetsInlineLimit: 0, rollupOptions: { input: ENTRY } },
  })) as Rollup.RollupOutput
  const css = output.output.find((file) => file.fileName.endsWith('.css'))
  return css?.type === 'asset' ? String(css.source) : ''
}

async function viteDev() {
  const server = await createServer({
    root: FIXTURE,
    configFile: false,
    logLevel: 'silent',
    css: { postcss: { plugins: [plugin(true)] }, devSourcemap: true },
    server: { port: 0, watch: null },
  })
  try {
    return await server.transformRequest('/src/index.css?direct')
  } finally {
    await server.close()
  }
}

describe('@pandacss/postcss imports', () => {
  it('keeps imported rule sources under polyfill', async () => {
    const root = inlinedEntry(LAYER_ORDER, '@font-face { src: url(../fonts/lib.woff2) }')

    const result = await postcss([plugin(true)]).process(root, { from: ENTRY })

    expect(result.css).not.toContain(LAYER_ORDER)
    expect(sourceFiles(result.root).slice(0, 1)).toMatchInlineSnapshot(`
      [
        "@font-face ← /src/lib/fonts.css",
      ]
    `)
  })

  it('keeps the layer order without polyfill', async () => {
    const root = inlinedEntry(LAYER_ORDER, '@font-face { src: url(../fonts/lib.woff2) }')

    const result = await postcss([plugin(false)]).process(root, { from: ENTRY })

    expect(result.css).toContain(LAYER_ORDER)
    expect(sourceFiles(result.root).slice(0, 2)).toMatchInlineSnapshot(`
      [
        "@layer ← /src/index.css",
        "@font-face ← /src/lib/fonts.css",
      ]
    `)
  })

  it('strips a layer order from an imported file', async () => {
    const root = inlinedEntry('', `${LAYER_ORDER}\n@font-face { src: url(../fonts/lib.woff2) }`)

    const result = await postcss([plugin(true)]).process(root, { from: ENTRY })

    expect(result.css).not.toContain(LAYER_ORDER)
    expect(result.css).toContain('.color_red')
  })

  it('strips a nested layer order', async () => {
    const css = ['@media screen {', '  @layer reset, base, tokens, recipes, utilities', '}'].join('\n')

    const result = await postcss([plugin(true)]).process(css, { from: ENTRY })

    expect(result.css).not.toContain('@layer reset')
    expect(result.css).toContain('.color_red')
  })

  it("keeps the user's layer statements and blocks", async () => {
    const css = [LAYER_ORDER, '@layer theme, components;', '@layer components { .card { padding: 0 } }'].join('\n')

    const result = await postcss([plugin(true)]).process(css, { from: ENTRY })

    expect(result.css).not.toContain(LAYER_ORDER)
    expect(result.css).toContain('@layer theme, components;')
    expect(result.css).toContain('@layer components { .card { padding: 0 } }')
  })

  it('strips a layer order with a comment inside', async () => {
    const css = '@layer reset, /* keep first */ base, tokens, recipes, utilities;'

    const result = await postcss([plugin(true)]).process(css, { from: ENTRY })

    expect(result.css).not.toContain('@layer reset')
    expect(result.css).toContain('.color_red')
  })

  it('strips duplicate layer orders across files', async () => {
    const root = inlinedEntry(LAYER_ORDER, LAYER_ORDER)

    const result = await postcss([plugin(true)]).process(root, { from: ENTRY })

    expect(result.css).not.toContain('@layer reset')
    expect(result.css.match(/\.color_red/g)).toHaveLength(1)
  })

  it('strips a layer order with extra user layers', async () => {
    const css = '@layer reset, base, tokens, recipes, utilities, overrides;'

    const result = await postcss([plugin(true)]).process(css, { from: ENTRY })

    expect(result.css).not.toContain('@layer reset')
  })

  it('maps imported rules to their own files under polyfill', async () => {
    const root = inlinedEntry(LAYER_ORDER, '@font-face { src: url(../fonts/lib.woff2) }')

    const result = await postcss([plugin(true)]).process(root, { from: ENTRY, to: ENTRY, map: { inline: false } })

    expect(result.map.toJSON().sources).toMatchInlineSnapshot(`
      [
        "lib/fonts.css",
        "index.css",
      ]
    `)
  })

  it('ignores stylesheets without a Panda layer order', async () => {
    const css = '@layer theme, components;\n.card { padding: 0 }'

    const result = await postcss([plugin(true)]).process(css, { from: ENTRY })

    expect(result.css).toBe(css)
  })

  it('resolves imported urls in a Vite build with polyfill', async () => {
    const css = await viteBuild(true)

    expect(urls(css)).toMatchInlineSnapshot(`
      [
        "url(/assets/icon-[hash].svg)",
        "url(/assets/lib-[hash].woff2)",
      ]
    `)
    expect(css).not.toContain('@layer reset')
    expect(css).toContain('.color_red')
  })

  it('resolves imported urls in a Vite build without polyfill', async () => {
    const css = await viteBuild(false)

    expect(urls(css)).toMatchInlineSnapshot(`
      [
        "url(/assets/icon-[hash].svg)",
        "url(/assets/lib-[hash].woff2)",
      ]
    `)
    expect(css).toContain('.color_red')
  })

  it('resolves imported urls in the Vite dev server with polyfill', async () => {
    const result = await viteDev()

    expect(result?.code).not.toMatch(/url\(\.\.\//)
    expect(result?.map && 'sources' in result.map ? result.map.sources : []).toMatchInlineSnapshot(`
      [
        "lib/deep/icons.css",
        "lib/fonts.css",
        "index.css",
      ]
    `)
  })
})
