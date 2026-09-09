/**
 * Runs the plugin under a real Bun binary: `Bun.build`, `bun run` and `bun test`.
 * Skipped when `bun` is not on PATH.
 */
import { execFileSync, execSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const PLUGIN_ENTRY = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'index.ts')
const PRELOAD_ENTRY = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'preload.ts')

const CONFIG = `export default {
  outdir: 'styled-system',
  include: ['src/**/*.{ts,tsx}'],
  utilities: { color: {}, padding: {} },
}
`

const ENTRY_CSS = `@layer reset, base, tokens, recipes, utilities;
.app { color: black }
`

/** A static call the transform inlines, and a half-static one that needs the `@pandacss-internal/css` helper. */
const APP = `import { css } from '../styled-system/css'
import './index.css'
export const cls = css({ color: 'red', padding: '8px' })
export const box = (size: string) => css({ color: 'red', padding: size })
`

const MAIN = `import { box, cls } from './app'
console.log(cls, '|', box('4px'))
`

const MAIN_OUTPUT = 'color_red padding_8px | color_red padding_4px\n'

const APP_TEST = `import { expect, test } from 'bun:test'
import { box, cls } from './app'
test('panda classes', () => {
  expect(cls).toBe('color_red padding_8px')
  expect(box('4px')).toBe('color_red padding_4px')
})
`

const INDEX_HTML = `<!doctype html>
<html>
  <head><link rel="stylesheet" href="./index.css" /></head>
  <body><script type="module" src="./app.ts"></script></body>
</html>
`

/** Starts Bun's fullstack dev server, prints the stylesheet it serves for the page, and exits. */
const SERVE_SCRIPT = `import index from './src/index.html'
const server = Bun.serve({ routes: { '/': index }, development: true, port: 0 })
const html = await (await fetch(\`http://localhost:\${server.port}/\`)).text()
const href = html.match(/href="([^"]+\\.css)"/)?.[1]
console.log(await (await fetch(\`http://localhost:\${server.port}\${href}\`)).text())
server.stop(true)
`

/** Same, but edits a source while the server runs and reports whether the page's script picked up the new rule. */
const SERVE_EDIT_SCRIPT = `import index from './src/index.html'
const server = Bun.serve({ routes: { '/': index }, development: true, port: 0 })
const script = async () => {
  const html = await (await fetch(\`http://localhost:\${server.port}/\`)).text()
  const src = html.match(/src="([^"]+\\.js)"/)?.[1]
  return (await fetch(\`http://localhost:\${server.port}\${src}\`)).text()
}
const before = (await script()).includes('.padding_16px')
await Bun.write('./src/app.ts', (await Bun.file('./src/app.ts').text()).replace("padding: '8px'", "padding: '16px'"))
let after = false
for (let attempt = 0; attempt < 20 && !after; attempt++) {
  await Bun.sleep(250)
  after = (await script()).includes('.padding_16px')
}
console.log('RESULT ' + JSON.stringify({ before, after }))
server.stop(true)
`

const buildScript = (transform: boolean) => `import { pandacss } from ${JSON.stringify(PLUGIN_ENTRY)}
const result = await Bun.build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist',
  plugins: [pandacss({ transform: ${transform} })],
})
if (!result.success) {
  console.error(result.logs.map(String).join('\\n'))
  process.exit(1)
}
`

const preloadScript = (transform: boolean) => `import { register } from ${JSON.stringify(PLUGIN_ENTRY)}
await register({ transform: ${transform} })
`

const bunfig = (preload: string) => `preload = [${JSON.stringify(preload)}]
[test]
preload = [${JSON.stringify(preload)}]
`

function createProject() {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-bun-e2e-')))
  mkdirSync(join(dir, 'src'))
  const project = {
    dir,
    exists: (file: string) => existsSync(join(dir, file)),
    read: (file: string) => readFileSync(join(dir, file), 'utf8'),
    write: (file: string, contents: string) => writeFileSync(join(dir, file), contents),
    remove: (file: string) => rmSync(join(dir, file), { recursive: true, force: true }),
    bun: (...args: string[]) => execFileSync('bun', args, { cwd: dir, encoding: 'utf8', stdio: 'pipe' }),
  }
  project.write('panda.config.ts', CONFIG)
  project.write('src/index.css', ENTRY_CSS)
  project.write('src/app.ts', APP)
  project.write('src/main.ts', MAIN)
  return project
}

const hasBun = (() => {
  try {
    execSync('bun --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

describe.skipIf(!hasBun)('@pandacss/bun under a real Bun', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  it('Bun.build bundles the styled-system runtime and emits the injected stylesheet', () => {
    const project = createProject()
    dir = project.dir
    project.write('build.ts', buildScript(false))

    project.bun('build.ts')

    expect(project.exists('styled-system/css/index.js')).toBe(true)
    expect(project.read('dist/main.js')).toContain('css({')
    expect(project.read('dist/main.css')).toContain('.app')
    expect(project.read('dist/main.css')).toContain('.color_red')
    expect(project.bun('dist/main.js')).toBe(MAIN_OUTPUT)
  })

  it('Bun.build with transform inlines static css() calls and bundles the internal helper', () => {
    const project = createProject()
    dir = project.dir
    project.write('build.ts', buildScript(true))

    project.bun('build.ts')

    expect(project.read('dist/main.js')).toContain('"color_red padding_8px"')
    expect(project.read('dist/main.js')).not.toContain(`css({ color: 'red', padding: '8px' })`)
    expect(project.bun('dist/main.js')).toBe(MAIN_OUTPUT)
  })

  it('the default export is a ready-made plugin for Bun.build', () => {
    const project = createProject()
    dir = project.dir
    project.write(
      'build.ts',
      buildScript(false)
        .replace('import { pandacss } from', 'import panda from')
        .replace('pandacss({ transform: false })', 'panda'),
    )

    project.bun('build.ts')

    expect(project.read('dist/main.css')).toContain('.color_red')
  })

  it('a fullstack dev server loads the plugin from [serve.static] in bunfig.toml', () => {
    const project = createProject()
    dir = project.dir
    project.write('bunfig.toml', `[serve.static]\nplugins = [${JSON.stringify(PLUGIN_ENTRY)}]\n`)
    project.write('src/index.html', INDEX_HTML)
    project.write('serve.ts', SERVE_SCRIPT)

    const css = project.bun('serve.ts')

    expect(css).toContain('.app')
    expect(css).toContain('.color_red')
  })

  it('the dev server ships new styles with the hot-reloaded module after a source edit', () => {
    const project = createProject()
    dir = project.dir
    project.write('bunfig.toml', `[serve.static]\nplugins = [${JSON.stringify(PLUGIN_ENTRY)}]\n`)
    project.write('src/index.html', INDEX_HTML)
    project.write('serve.ts', SERVE_EDIT_SCRIPT)

    // Bun prints a clear-screen sequence on reload, so pick the result line out of stdout.
    const result = project.bun('serve.ts').match(/RESULT (.*)/)?.[1] ?? ''

    expect(JSON.parse(result)).toEqual({ before: false, after: true })
  })

  it('Bun.build fails when there is no panda config', () => {
    const project = createProject()
    dir = project.dir
    project.write('build.ts', buildScript(false))
    project.remove('panda.config.ts')

    expect(() => project.bun('build.ts')).toThrow()
  })

  it('the shipped preload runs codegen before bun run loads the entry', () => {
    const project = createProject()
    dir = project.dir
    project.write('bunfig.toml', bunfig(PRELOAD_ENTRY))

    expect(project.bun('run', 'src/main.ts')).toBe(MAIN_OUTPUT)
    expect(project.exists('styled-system/css/index.js')).toBe(true)
  })

  it('a preload with transform rewrites sources and serves the internal helper to bun run', () => {
    const project = createProject()
    dir = project.dir
    project.write('panda-preload.ts', preloadScript(true))
    project.write('bunfig.toml', bunfig('./panda-preload.ts'))

    expect(project.bun('run', 'src/main.ts')).toBe(MAIN_OUTPUT)
  })

  it('bun test picks the plugin up from the [test] preload', () => {
    const project = createProject()
    dir = project.dir
    project.write('src/app.test.ts', APP_TEST)
    project.write('panda-preload.ts', preloadScript(true))
    project.write('bunfig.toml', bunfig('./panda-preload.ts'))

    expect(() => project.bun('test')).not.toThrow()
  })
})
