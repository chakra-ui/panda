import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import webpack, { type Watching } from 'webpack'
import { afterEach, describe, expect, it } from 'vitest'
import { PandaWebpackPlugin } from '../src'

const CSS_ROOT = '@layer reset, base, tokens, recipes, utilities;'
const CSS_LOADER = createRequire(import.meta.url).resolve('@pandacss/webpack/css-loader')

const card = (color: string) => `import { css } from '@panda/css'
export const className = css({ color: '${color}' })
`

function createMonorepo(include: (root: string) => string) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-webpack-monorepo-')))
  const app = join(root, 'apps', 'demo')
  const ui = join(root, 'packages', 'ui', 'src')
  mkdirSync(join(app, 'src'), { recursive: true })
  mkdirSync(ui, { recursive: true })
  writeFileSync(
    join(app, 'panda.config.ts'),
    `export default {
  outdir: 'styled-system',
  include: ['./src/**/*.tsx', ${include(root)}],
  importMap: { css: ['@panda/css'], recipe: [], pattern: [], jsx: [], tokens: [] },
}
`,
  )
  writeFileSync(join(app, 'src', 'index.css'), CSS_ROOT)
  writeFileSync(join(app, 'src', 'index.js'), `import css from './index.css'\nexport default css\n`)
  writeFileSync(join(ui, 'Card.tsx'), card('chartreuse'))
  return { root, app, ui }
}

function startWatch(app: string) {
  const compiler = webpack({
    mode: 'development',
    devtool: false,
    context: app,
    entry: join(app, 'src', 'index.js'),
    output: { path: join(app, 'dist'), filename: 'main.js' },
    module: { rules: [{ test: /\.css$/, type: 'asset/source' }] },
    resolveLoader: { alias: { '@pandacss/webpack/css-loader': CSS_LOADER } },
    plugins: [new PandaWebpackPlugin({ cwd: app })],
    infrastructureLogging: { level: 'none' },
  })
  const watching = compiler.watch({ aggregateTimeout: 50 }, (error, stats) => {
    if (error || stats?.hasErrors()) throw error ?? new Error(stats?.toString('errors-only'))
  })
  const bundle = () => readFileSync(join(app, 'dist', 'main.js'), 'utf8')
  return { watching, bundle }
}

async function expectBundle(read: () => string, text: string) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if (read().includes(text)) return
    } catch {}
    await new Promise((done) => setTimeout(done, 100))
  }
  throw new Error(`timed out waiting for ${text} in the bundle`)
}

describe('@pandacss/webpack watch mode in a monorepo', () => {
  let root: string | undefined
  let watching: Watching | undefined

  afterEach(async () => {
    await new Promise<void>((done) => (watching ? watching.close(() => done()) : done()))
    watching = undefined
    if (root) rmSync(root, { recursive: true, force: true })
    root = undefined
  })

  it('rebuilds CSS after an edit in a sibling package included with ../', async () => {
    await expectSiblingPackageRebuild(() => `'../../packages/ui/src/**/*.tsx'`)
  })

  it('rebuilds CSS after an edit in a sibling package included with an absolute path', async () => {
    await expectSiblingPackageRebuild((dir) => JSON.stringify(join(dir, 'packages/ui/src/**/*.tsx')))
  })

  async function expectSiblingPackageRebuild(include: (root: string) => string) {
    const fixture = createMonorepo(include)
    root = fixture.root
    const started = startWatch(fixture.app)
    watching = started.watching

    await expectBundle(started.bundle, 'chartreuse')
    writeFileSync(join(fixture.ui, 'Card.tsx'), card('orchid'))
    await expectBundle(started.bundle, 'orchid')
  }
})
