import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import webpack, { type Configuration, type Watching } from 'webpack'
import { afterEach, describe, expect, it } from 'vitest'
import { PandaWebpackPlugin } from '../src'

const CSS_ROOT = '@layer reset, base, tokens, recipes, utilities;'
const CSS_LOADER = createRequire(import.meta.url).resolve('@pandacss/webpack/css-loader')

describe('@pandacss/webpack with Panda layers in an @import-ed file', () => {
  let root: string | undefined
  let watching: Watching | undefined

  afterEach(async () => {
    await new Promise<void>((done) => (watching ? watching.close(() => done()) : done()))
    watching = undefined
    if (root) rmSync(root, { recursive: true, force: true })
    root = undefined
  })

  it('injects the stylesheet into the file that imports the layer declaration', async () => {
    root = createProject({
      'src/index.css': '@import "./styles/layers.css";\n.app { color: black }',
      'src/styles/layers.css': CSS_ROOT,
    })

    const bundle = await build(root)
    expect(bundle).toContain('chartreuse')
    expect(bundle).toContain('black')
  })

  it('follows nested, url() and bare relative imports', async () => {
    root = createProject({
      'src/index.css': '@import url("./styles/global.css");',
      'src/styles/global.css': "@import 'panda/layers.css';",
      'src/styles/panda/layers.css': CSS_ROOT,
    })

    expect(await build(root)).toContain('chartreuse')
  })

  it('ignores a commented-out import', async () => {
    root = createProject({ 'src/index.css': '/* @import "./styles/layers.css"; */', 'src/styles/layers.css': CSS_ROOT })

    expect(await build(root)).not.toContain('chartreuse')
  })

  it('rebuilds once the imported file gains the layer declaration', async () => {
    root = createProject({ 'src/index.css': '@import "./styles/layers.css";', 'src/styles/layers.css': '.layers {}' })
    const bundlePath = join(root, 'dist', 'main.js')
    watching = webpack(config(root))!.watch({ aggregateTimeout: 50 }, (error, stats) => {
      if (error || stats?.hasErrors()) throw error ?? new Error(stats?.toString('errors-only'))
    })

    await waitForBundle(bundlePath, 'styles/layers.css')
    expect(readFileSync(bundlePath, 'utf8')).not.toContain('chartreuse')

    writeFileSync(join(root, 'src/styles/layers.css'), CSS_ROOT)
    expect(await waitForBundle(bundlePath, 'chartreuse')).toContain('chartreuse')
  })
})

function createProject(files: Record<string, string>) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-webpack-imports-')))
  writeFiles(root, {
    'panda.config.ts': `export default {
  outdir: 'styled-system',
  include: ['./src/**/*.tsx'],
  importMap: { css: ['@panda/css'], recipe: [], pattern: [], jsx: [], tokens: [] },
}
`,
    'src/Card.tsx': `import { css } from '@panda/css'\nexport const className = css({ color: 'chartreuse' })\n`,
    'src/index.js': `import css from './index.css'\nexport default css\n`,
    ...files,
  })
  return root
}

function config(root: string): Configuration {
  return {
    mode: 'development',
    devtool: false,
    context: root,
    entry: join(root, 'src', 'index.js'),
    output: { path: join(root, 'dist'), filename: 'main.js' },
    module: { rules: [{ test: /\.css$/, type: 'asset/source' }] },
    resolveLoader: { alias: { '@pandacss/webpack/css-loader': CSS_LOADER } },
    plugins: [new PandaWebpackPlugin({ cwd: root })],
    infrastructureLogging: { level: 'none' },
  }
}

function build(root: string) {
  return new Promise<string>((done, fail) => {
    webpack(config(root))!.run((error, stats) => {
      if (error || stats?.hasErrors()) return fail(error ?? new Error(stats?.toString('errors-only')))
      done(readFileSync(join(root, 'dist', 'main.js'), 'utf8'))
    })
  })
}

async function waitForBundle(file: string, text: string): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const bundle = existsSync(file) ? readFileSync(file, 'utf8') : ''
    if (bundle.includes(text)) return bundle
    await new Promise((done) => setTimeout(done, 100))
  }
  throw new Error(`timed out waiting for ${text} in the bundle`)
}

function writeFiles(root: string, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), content)
  }
}
