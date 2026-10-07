import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import postcss, { type AtRule, type Root } from 'postcss'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import pandacss from '../src/index'

const CSS_ROOT = '@layer reset, base, tokens, recipes, utilities;'

let cwd: string

beforeAll(() => {
  cwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-postcss-polyfill-')))
  writeFileTree(cwd, {
    'panda.config.ts': `export default {
  polyfill: true,
  preflight: false,
  outdir: 'styled-system',
  include: ['./src/**/*.ts'],
  importMap: { css: ['@panda/css'] },
  utilities: { color: { className: 'c' } },
}
`,
    'src/app.ts': `import { css } from '@panda/css'\ncss({ color: 'red' })\n`,
    'src/vendor/css/lib.css': `@font-face { font-family: Lib; src: url(../fonts/lib.woff2) }\n.lib { font-family: Lib }`,
    'src/vendor/css/chain.css': `@import "./sub/deep.css";\n.chain { background: url(../img/bg.png) }`,
    'src/vendor/css/sub/deep.css': `.deep { background: url("../../img/bg.png") }`,
    'src/layers.css': CSS_ROOT,
  })
})

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true })
})

describe('@pandacss/postcss polyfill', () => {
  it('keeps the source file of every inlined @import rule', async () => {
    const { root } = await run(`@import "./vendor/css/chain.css";\n@import "./vendor/css/lib.css";\n${CSS_ROOT}`)

    expect(urlSources(root)).toEqual({
      'url("../../img/bg.png")': 'src/vendor/css/sub/deep.css',
      'url(../img/bg.png)': 'src/vendor/css/chain.css',
      'url(../fonts/lib.woff2)': 'src/vendor/css/lib.css',
    })
  })

  it('strips the order statement in any position and format', async () => {
    const inputs = [
      `@import "./vendor/css/lib.css";\n${CSS_ROOT}`,
      `${CSS_ROOT}\n@import "./vendor/css/lib.css";`,
      `@import "./vendor/css/lib.css";\n@import "./layers.css";`,
      `@import "./vendor/css/lib.css";\n@import "./layers.css" supports(display: grid);`,
      `@import "./vendor/css/lib.css";\n/* panda */\n@layer   reset,\n  base, tokens,recipes ,\n  utilities ;`,
      `@import "./vendor/css/lib.css";\n@layer reset, base, tokens, recipes.slots, recipes, utilities;`,
      `@import "./vendor/css/lib.css";\n@supports (display: grid) { @layer reset, base, tokens, recipes, utilities }`,
    ]

    for (const input of inputs) {
      const { css, root } = await run(input)
      expect(css, input).not.toMatch(/@layer\s+reset/)
      expect(css, input).toContain('.c_red')
      expect(urlSources(root)['url(../fonts/lib.woff2)'], input).toBe('src/vendor/css/lib.css')
    }
  })

  it('keeps user layers and unrelated order statements', async () => {
    const { css } = await run(
      `@import "./vendor/css/lib.css" layer(vendor);\n@layer vendor, app;\n${CSS_ROOT}\n@layer reset, base;\n@layer app { .app { color: green } }`,
    )

    expect(layerStatements(css)).toEqual(['@layer vendor, app', '@layer reset, base'])
    expect(css).toContain('@layer vendor {')
    expect(css).toContain('@layer app {')
    expect(css).toContain('.c_red')
  })

  it('maps inlined rules back to their own files', async () => {
    const result = await run(`@import "./vendor/css/lib.css";\n${CSS_ROOT}`, {
      map: { inline: false },
      to: join(cwd, 'dist/index.css'),
    })

    expect(result.map.toJSON().sources).toEqual(
      expect.arrayContaining(['../src/vendor/css/lib.css', '../src/index.css']),
    )
  })
})

const inlineImports = {
  postcssPlugin: 'inline-imports',
  Once(root: Root) {
    root.walkAtRules('import', (rule) => inline(rule))
  },
}

function inline(rule: AtRule) {
  const [, path, condition] = rule.params.match(/^"([^"]+)"\s*(.*)$/)!
  const file = resolve(dirname(rule.source!.input.file!), path!)
  const imported = postcss.parse(readFileSync(file, 'utf8'), { from: file })
  imported.walkAtRules('import', (nested) => inline(nested))

  if (!condition) {
    rule.replaceWith(imported.nodes)
    return
  }

  const [, name, params] = condition.match(/^(layer|supports)\((.*)\)$/) ?? ['', 'media', condition]
  rule.replaceWith(
    postcss.atRule({ name: name!, params: name === 'supports' ? `(${params})` : params!, nodes: imported.nodes }),
  )
}

async function run(input: string, options: { map?: { inline: boolean }; to?: string } = {}) {
  const from = join(cwd, 'src/index.css')
  return postcss([inlineImports, pandacss({ cwd })]).process(input, { from, ...options })
}

function urlSources(root: Root) {
  const sources: Record<string, string> = {}
  root.walkDecls((decl) => {
    const url = decl.value.match(/url\([^)]*\)/)?.[0]
    if (url) sources[url] = decl.source!.input.file!.slice(cwd.length + 1)
  })
  return sources
}

function layerStatements(css: string) {
  return [...css.matchAll(/@layer [^{;]+;/g)].map(([statement]) => statement.slice(0, -1))
}

function writeFileTree(root: string, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    const file = join(root, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, content)
  }
}
