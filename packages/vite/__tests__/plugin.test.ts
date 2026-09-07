import { existsSync, mkdtempSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createServer, type ViteDevServer } from 'vite'
import { pandacss } from '../src'

const CONFIG = `export default {
  outdir: 'styled-system',
  include: ['**/*.tsx'],
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
}
`

/** The user's real CSS entry — declares Panda's layers, so the plugin treats it
 *  as the root and injects the compiled stylesheet after it. */
const ENTRY_CSS = `@layer reset, base, tokens, recipes, utilities;
.app { color: black }
`

const APP = (style: string) => `import { css } from '@panda/css'
import './index.css'
export const App = () => <div className={css(${style})} />
`

function configSource(outdir = 'styled-system') {
  return CONFIG.replace("outdir: 'styled-system'", `outdir: '${outdir}'`)
}

function createFixture(style = `{ color: 'red' }`, config = CONFIG) {
  // realpath so test paths match Vite's realpath'd root (/tmp → /private/tmp on macOS).
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-vite-')))
  writeFileSync(join(dir, 'panda.config.ts'), config)
  writeFileSync(join(dir, 'index.css'), ENTRY_CSS)
  writeFileSync(join(dir, 'App.tsx'), APP(style))
  return dir
}

async function startServer(dir: string): Promise<ViteDevServer> {
  const server = await createServer({
    root: dir,
    logLevel: 'silent',
    configFile: false,
    plugins: [pandacss()],
    // A listening server keeps the HMR machinery live. Tests emit watcher events themselves, so the
    // real file watcher stays off; otherwise its own events race the emitted ones.
    server: { port: 0, strictPort: false, watch: null },
    optimizeDeps: { noDiscovery: true },
    appType: 'custom',
  })
  await server.listen()
  return server
}

/** Pull the injected stylesheet text from the user's CSS entry. Vite wraps dev
 *  CSS in a JS module, but the rule text is embedded verbatim, so substrings hold. */
async function readCss(server: ViteDevServer): Promise<string> {
  const result = await server.transformRequest('/index.css')
  return result?.code ?? ''
}

async function waitForCss(server: ViteDevServer, needle: string): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const css = await readCss(server)
    if (css.includes(needle)) return css
    await new Promise((done) => setTimeout(done, 100))
  }
  throw new Error(`timed out waiting for ${JSON.stringify(needle)} in the served CSS`)
}

async function waitForCssWithout(server: ViteDevServer, needle: string): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const css = await readCss(server)
    if (!css.includes(needle)) return css
    await new Promise((done) => setTimeout(done, 100))
  }
  throw new Error(`timed out waiting for ${JSON.stringify(needle)} to leave the served CSS`)
}

/** Record every HMR payload Vite sends to the browser so a test can prove no page reload happened. */
function recordHmr(server: ViteDevServer): Array<{ type: string; updates?: Array<{ type: string; path: string }> }> {
  const sent: Array<{ type: string; updates?: Array<{ type: string; path: string }> }> = []
  const hot = server.environments.client.hot
  const send = hot.send.bind(hot)
  hot.send = ((payload: { type: string }) => {
    sent.push(payload as never)
    return send(payload as never)
  }) as typeof hot.send
  return sent
}

const EXTRA = (style: string) => `import { css } from '@panda/css'
export const extra = css(${style})
`

async function waitForWarning(warnings: string[], needle: string): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const warning = warnings.find((item) => item.includes(needle))
    if (warning) return warning
    await new Promise((done) => setTimeout(done, 100))
  }
  throw new Error(`timed out waiting for warning ${JSON.stringify(needle)}`)
}

describe('@pandacss/vite', () => {
  let dir: string | undefined
  let server: ViteDevServer | undefined

  afterEach(async () => {
    await server?.close()
    server = undefined
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  it('injects the stylesheet into the CSS file that declares Panda layers', async () => {
    dir = createFixture(`{ color: 'red' }`)
    server = await startServer(dir)

    const css = await readCss(server)
    expect(css).toContain('red') // generated
    expect(css).toContain('black') // the user's own CSS is preserved
    expect(css.match(/@layer reset, base, tokens, recipes, utilities;/g)).toHaveLength(1)
  })

  it('writes the styled-system runtime + types to disk at startup', async () => {
    dir = createFixture()
    server = await startServer(dir)
    await readCss(server) // force buildStart

    expect(existsSync(join(dir, 'styled-system', 'css', 'index.js'))).toBe(true)
    expect(existsSync(join(dir, 'styled-system', 'types', 'index.d.ts'))).toBe(true)
  })

  it('regenerates the root CSS when a source file changes', async () => {
    dir = createFixture(`{ padding: '4px' }`)
    server = await startServer(dir)

    const initial = await waitForCss(server, '4px')
    expect(initial).not.toContain('8px')

    const appFile = join(dir, 'App.tsx')
    writeFileSync(appFile, APP(`{ padding: '8px' }`))
    server.watcher.emit('change', appFile)

    const updated = await waitForCss(server, '8px')
    // Additive refresh keeps prior styles in dev — no flash of a missing rule.
    expect(updated).toContain('4px')
  })

  it('adds CSS when a matching source file is created', async () => {
    dir = createFixture(`{ color: 'red' }`)
    server = await startServer(dir)
    expect(await waitForCss(server, 'red')).not.toContain('rebeccapurple')

    const newFile = join(dir, 'New.tsx')
    writeFileSync(newFile, APP(`{ color: 'rebeccapurple' }`))
    server.watcher.emit('add', newFile)

    expect(await waitForCss(server, 'rebeccapurple')).toContain('rebeccapurple')
  })

  it('removes CSS when a source file is deleted', async () => {
    dir = createFixture(`{ color: 'rebeccapurple' }`)
    server = await startServer(dir)
    expect(await waitForCss(server, 'rebeccapurple')).toContain('rebeccapurple')

    const appFile = join(dir, 'App.tsx')
    rmSync(appFile)
    server.watcher.emit('unlink', appFile)

    expect(await waitForCssWithout(server, 'rebeccapurple')).not.toContain('rebeccapurple')
  })

  it('hot-swaps the stylesheet on create and delete without a page reload', async () => {
    dir = createFixture(`{ color: 'red' }`)
    server = await startServer(dir)
    expect(await waitForCss(server, 'red')).not.toContain('0.33em')
    const sent = recordHmr(server)

    const extraFile = join(dir, 'Extra.tsx')
    writeFileSync(extraFile, EXTRA(`{ letterSpacing: '0.33em' }`))
    server.watcher.emit('add', extraFile)
    expect(await waitForCss(server, '0.33em')).toContain('red')

    rmSync(extraFile)
    server.watcher.emit('unlink', extraFile)
    expect(await waitForCssWithout(server, '0.33em')).toContain('red')

    // Vite ships CSS imported from JS as a js-update; either way it is a hot swap, never a reload.
    expect(sent.map((payload) => payload.type)).toEqual(['update', 'update'])
    expect(sent.flatMap((payload) => payload.updates ?? []).map((update) => update.path)).toEqual([
      '/index.css',
      '/index.css',
    ])
  })

  it('keeps styles over HMR when a source file is renamed', async () => {
    dir = createFixture(`{ color: 'red' }`)
    const before = join(dir, 'Before.tsx')
    writeFileSync(before, EXTRA(`{ letterSpacing: '0.33em' }`))
    server = await startServer(dir)
    await waitForCss(server, '0.33em')
    const sent = recordHmr(server)

    const after = join(dir, 'After.tsx')
    renameSync(before, after)
    server.watcher.emit('unlink', before)
    server.watcher.emit('add', after)

    await new Promise((done) => setTimeout(done, 300))
    expect(await waitForCss(server, '0.33em')).toContain('red')
    expect(sent.map((payload) => payload.type)).not.toContain('full-reload')
  })

  it('drops the styles of a deleted file that another module imports', async () => {
    dir = createFixture(`{ color: 'red' }`)
    writeFileSync(join(dir, 'Widget.tsx'), EXTRA(`{ letterSpacing: '0.33em' }`))
    // Vite cannot resolve the fake '@panda/css' import map entry, so the importer only pulls in Widget
    // and self-accepts, giving Vite an HMR boundary for the delete.
    writeFileSync(
      join(dir, 'App.tsx'),
      `import './index.css'\nimport { extra } from './Widget'\nexport const App = () => extra\nif (import.meta.hot) import.meta.hot.accept()\n`,
    )
    server = await startServer(dir)
    await server.transformRequest('/App.tsx')
    await waitForCss(server, '0.33em')
    const sent = recordHmr(server)

    const widget = join(dir, 'Widget.tsx')
    rmSync(widget)
    server.watcher.emit('unlink', widget)

    expect(await waitForCssWithout(server, '0.33em')).toContain('black')
    expect(sent.map((payload) => payload.type)).not.toContain('full-reload')
  })

  it('invalidates the stylesheet root in the SSR module graph too', async () => {
    dir = createFixture(`{ color: 'red' }`)
    server = await startServer(dir)
    await waitForCss(server, 'red')
    await server.environments.ssr.transformRequest('/index.css')
    const rootId = join(dir, 'index.css')
    expect(server.environments.ssr.moduleGraph.getModuleById(rootId)?.transformResult).toBeTruthy()

    const extraFile = join(dir, 'Extra.tsx')
    writeFileSync(extraFile, EXTRA(`{ letterSpacing: '0.33em' }`))
    server.watcher.emit('add', extraFile)
    await waitForCss(server, '0.33em')

    expect(server.environments.ssr.moduleGraph.getModuleById(rootId)?.transformResult).toBeNull()
  })

  it('keeps previous CSS and reports diagnostics when source syntax breaks', async () => {
    dir = createFixture(`{ color: 'red' }`)
    server = await startServer(dir)
    const warnings: string[] = []
    server.config.logger.warn = (message) => {
      warnings.push(String(message))
    }

    expect(await waitForCss(server, 'red')).toContain('red')

    const appFile = join(dir, 'App.tsx')
    writeFileSync(appFile, APP(`{ color: }`))
    server.watcher.emit('change', appFile)

    expect(await waitForCss(server, 'red')).toContain('red')
    const warning = await waitForWarning(warnings, 'while parsing')
    expect(warning.replaceAll(dir, '<root>')).toMatchInlineSnapshot(`
      "panda: 1 diagnostic(s) while parsing <root>/App.tsx
      warning js_parse_error <root>/App.tsx:3:55 Unexpected token. Panda could not fully parse this file; some styles may be missing."
    `)

    writeFileSync(appFile, APP(`{ color: 'blue' }`))
    server.watcher.emit('change', appFile)

    expect(await waitForCss(server, 'blue')).toContain('blue')
  })

  it('re-parses sources after a config reload', async () => {
    dir = createFixture(`{ color: 'red' }`)
    server = await startServer(dir)
    expect(await waitForCss(server, 'red')).toContain('red')

    const configFile = join(dir, 'panda.config.ts')
    writeFileSync(configFile, configSource('system'))
    server.watcher.emit('change', configFile)

    const css = await waitForCss(server, 'red')
    expect(css).toContain('red')
  })

  it('uses the reloaded config outdir when no plugin outdir override is set', async () => {
    dir = createFixture()
    server = await startServer(dir)
    await readCss(server)

    const configFile = join(dir, 'panda.config.ts')
    writeFileSync(configFile, configSource('system'))
    server.watcher.emit('change', configFile)

    for (let attempt = 0; attempt < 50; attempt++) {
      if (existsSync(join(dir, 'system', 'css', 'index.js'))) return
      await new Promise((done) => setTimeout(done, 100))
    }
    throw new Error('timed out waiting for codegen in updated config outdir')
  })
})
