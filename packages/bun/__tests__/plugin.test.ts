import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import panda, { pandacss, register, type OnLoadResult, type PandaPluginOptions, type PluginBuilder } from '../src'

const CONFIG = `export default {
  outdir: 'styled-system',
  include: ['src/**/*.{ts,tsx}'],
  utilities: { color: {}, padding: {} },
}
`

/** The user's CSS entry. It declares Panda's layers, so the plugin appends the compiled stylesheet after it. */
const ENTRY_CSS = `@layer reset, base, tokens, recipes, utilities;
.app { color: black }
`

const app = (style: string) => `import { css } from '../styled-system/css'
import './index.css'
export const cls = css(${style})
`

/** A throwaway project on disk: `panda.config.ts`, `src/index.css`, `src/app.ts`. */
function createProject(style = `{ color: 'red' }`) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-bun-')))
  mkdirSync(join(dir, 'src'))
  const project = {
    dir,
    path: (file: string) => join(dir, file),
    exists: (file: string) => existsSync(join(dir, file)),
    write: (file: string, contents: string) => writeFileSync(join(dir, file), contents),
  }
  project.write('panda.config.ts', CONFIG)
  project.write('src/index.css', ENTRY_CSS)
  project.write('src/app.ts', app(style))
  return project
}

type LoadCallback = Parameters<PluginBuilder['onLoad']>[1]
type ResolveCallback = Parameters<PluginBuilder['onResolve']>[1]

/**
 * Records the hooks a plugin registers and replays them the way Bun would.
 * `runtime` mimics `Bun.plugin`, which has no `onStart` and serves virtual modules through `module()`.
 */
function createBun(kind: 'build' | 'runtime' = 'build') {
  const loads: Array<{ filter: RegExp; namespace?: string; callback: LoadCallback }> = []
  const resolves: Array<{ filter: RegExp; callback: ResolveCallback }> = []
  const modules = new Map<string, () => OnLoadResult | Promise<OnLoadResult>>()

  const builder: PluginBuilder = {
    onLoad: (constraints, callback) => {
      loads.push({ ...constraints, callback })
    },
    onResolve: (constraints, callback) => {
      resolves.push({ ...constraints, callback })
    },
    module: (specifier, callback) => {
      modules.set(specifier, callback)
    },
    ...(kind === 'build' ? { onStart: () => undefined } : {}),
  }

  return {
    builder,
    loads,
    modules,
    async load(path: string, namespace = 'file', defer?: () => Promise<void>) {
      const hook = loads.find((it) => (!it.namespace || it.namespace === namespace) && it.filter.test(path))
      return hook?.callback({ path, namespace, defer })
    },
    async resolve(specifier: string) {
      const hook = resolves.find((it) => it.filter.test(specifier))
      return hook?.callback({ path: specifier, importer: '' })
    },
  }
}

async function setupPlugin(options: PandaPluginOptions, kind: 'build' | 'runtime' = 'build') {
  const bun = createBun(kind)
  await pandacss(options).setup(bun.builder)
  return bun
}

describe('@pandacss/bun in Bun.build', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
    vi.restoreAllMocks()
  })

  it('exports a ready-made plugin as the default, so bunfig.toml can name the package', () => {
    expect(panda.name).toBe('pandacss')
    expect(panda.setup).toBeTypeOf('function')
  })

  it('writes the styled-system folder before the build starts', async () => {
    const project = createProject()
    dir = project.dir

    await setupPlugin({ cwd: project.dir })

    expect(project.exists('styled-system/css/index.js')).toBe(true)
    expect(project.exists('styled-system/types/index.d.ts')).toBe(true)
  })

  it('writes the styled-system folder to the outdir option', async () => {
    const project = createProject()
    dir = project.dir

    await setupPlugin({ cwd: project.dir, outdir: 'system' })

    expect(project.exists('system/css/index.js')).toBe(true)
  })

  it('loads the config named by configPath', async () => {
    const project = createProject()
    dir = project.dir
    project.write('panda.web.ts', CONFIG.replace("outdir: 'styled-system'", "outdir: 'web-system'"))

    await setupPlugin({ cwd: project.dir, configPath: 'panda.web.ts' })

    expect(project.exists('web-system/css/index.js')).toBe(true)
  })

  it('appends the compiled stylesheet to the CSS entry that declares Panda layers', async () => {
    const project = createProject(`{ color: 'red' }`)
    dir = project.dir

    const bun = await setupPlugin({ cwd: project.dir })
    const result = await bun.load(project.path('src/index.css'))

    expect(result?.loader).toBe('css')
    expect(result?.contents).toMatchInlineSnapshot(`
      "@layer reset, base, tokens, recipes, utilities;
      .app { color: black }

      @layer base {
        :root {
          --made-with-panda: '🐼';
        }
      }
      @layer utilities {
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  it('leaves CSS files without Panda layers to Bun', async () => {
    const project = createProject()
    dir = project.dir
    project.write('src/extra.css', '.btn { display: flex }')

    const bun = await setupPlugin({ cwd: project.dir })

    expect(await bun.load(project.path('src/extra.css'))).toBeUndefined()
  })

  it('strips the layer order statement when polyfill is on', async () => {
    const project = createProject(`{ color: 'red' }`)
    dir = project.dir
    project.write('panda.config.ts', CONFIG.replace('utilities:', 'polyfill: true,\n  utilities:'))

    const bun = await setupPlugin({ cwd: project.dir })
    const result = await bun.load(project.path('src/index.css'))

    expect(result?.contents).toMatchInlineSnapshot(`
      "
      .app { color: black }

      :root:not(#\\#) {
        --made-with-panda: '🐼';
      }
      .color_red:not(#\\##\\##\\##\\##\\##\\##\\##\\##\\#) {
        color: red;
      }
      "
    `)
  })

  it('leaves sources to Bun unless transform is on', async () => {
    const project = createProject()
    dir = project.dir

    const bun = await setupPlugin({ cwd: project.dir })

    expect(await bun.load(project.path('src/app.ts'))).toBeUndefined()
    expect(await bun.resolve('@pandacss-internal/css')).toBeUndefined()
  })

  it('rewrites a static css() call to its class string', async () => {
    const project = createProject(`{ color: 'red', padding: '8px' }`)
    dir = project.dir

    const bun = await setupPlugin({ cwd: project.dir, transform: true })
    const result = await bun.load(project.path('src/app.ts'))

    expect(result?.loader).toBe('ts')
    expect(result?.contents).toMatchInlineSnapshot(`
      "import './index.css'
      export const cls = "color_red padding_8px"
      "
    `)
  })

  it('leaves a dynamic css() call on the styled-system runtime', async () => {
    const project = createProject()
    dir = project.dir
    project.write('src/app.ts', app('{ color }').replace('export const cls =', 'export const cls = (color: string) =>'))

    const bun = await setupPlugin({ cwd: project.dir, transform: true })
    const result = await bun.load(project.path('src/app.ts'))

    expect(result?.contents).toMatchInlineSnapshot(`
      "import { css } from '../styled-system/css'
      import './index.css'
      export const cls = (color: string) => css({ color })
      "
    `)
  })

  it('serves the @pandacss-internal/css module that rewritten sources import', async () => {
    const project = createProject()
    dir = project.dir

    const bun = await setupPlugin({ cwd: project.dir, transform: true })
    const resolved = await bun.resolve('@pandacss-internal/css')
    const runtime = await bun.load('@pandacss-internal/css', 'panda')

    expect(resolved).toEqual({ path: '@pandacss-internal/css', namespace: 'panda' })
    expect(runtime?.loader).toBe('js')
    expect(runtime?.contents).toContain('export')
  })

  it('picks the Bun loader from the file extension', async () => {
    const project = createProject()
    dir = project.dir
    project.write('src/Button.tsx', app(`{ color: 'red' }`))
    project.write('src/legacy.jsx', app(`{ color: 'red' }`))
    project.write('src/plain.js', app(`{ color: 'red' }`))

    const bun = await setupPlugin({ cwd: project.dir, transform: true })

    expect((await bun.load(project.path('src/Button.tsx')))?.loader).toBe('tsx')
    expect((await bun.load(project.path('src/legacy.jsx')))?.loader).toBe('jsx')
    expect((await bun.load(project.path('src/plain.js')))?.loader).toBe('js')
  })

  it('warns about a source file that fails to parse and keeps the stylesheet going', async () => {
    const project = createProject(`{ color: }`)
    dir = project.dir
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const bun = await setupPlugin({ cwd: project.dir })
    const result = await bun.load(project.path('src/index.css'))

    expect(warn.mock.calls[0]?.[0]).toContain(`while parsing ${project.path('src/app.ts')}`)
    expect(warn.mock.calls[0]?.[0]).toContain('js_parse_error')
    expect(result?.contents).toContain('.app { color: black }')
  })

  it('generates the stylesheet only after the rest of the rebuild has loaded', async () => {
    const project = createProject(`{ padding: '4px' }`)
    dir = project.dir

    const bun = await setupPlugin({ cwd: project.dir })
    await bun.load(project.path('src/app.ts'))
    project.write('src/app.ts', app(`{ padding: '8px' }`))

    // Bun resolves defer() once the other modules, including the edited one, have loaded.
    const result = await bun.load(project.path('src/index.css'), 'file', async () => {
      await bun.load(project.path('src/app.ts'))
    })

    expect(result?.contents).toContain('8px')
  })

  it('hands a hot-reloaded module the current stylesheet, since Bun will not re-run the CSS file', async () => {
    const project = createProject(`{ padding: '4px' }`)
    dir = project.dir

    const bun = await setupPlugin({ cwd: project.dir })
    expect(await bun.load(project.path('src/app.ts'))).toBeUndefined()

    project.write('src/app.ts', app(`{ padding: '8px' }`))
    const reloaded = await bun.load(project.path('src/app.ts'))

    expect(reloaded?.loader).toBe('ts')
    expect(reloaded?.contents).toMatchInlineSnapshot(`
      "import { css } from '../styled-system/css'
      import './index.css'
      export const cls = css({ padding: '8px' })

      ;(() => {
        if (typeof document === 'undefined') return
        let style = document.getElementById('panda-dev-styles')
        if (!style) { style = document.createElement('style'); style.id = 'panda-dev-styles'; document.head.append(style) }
        style.textContent = "@layer base {\\n  :root {\\n    --made-with-panda: '🐼';\\n  }\\n}\\n@layer utilities {\\n  .padding_4px {\\n    padding: 4px;\\n  }\\n  .padding_8px {\\n    padding: 8px;\\n  }\\n}\\n"
      })()
      "
    `)
  })

  it('refreshes the stylesheet after the dev server reloads an edited source', async () => {
    const project = createProject(`{ padding: '4px' }`)
    dir = project.dir

    const bun = await setupPlugin({ cwd: project.dir })
    await bun.load(project.path('src/app.ts'))
    expect((await bun.load(project.path('src/index.css')))?.contents).toContain('4px')

    project.write('src/app.ts', app(`{ padding: '8px' }`))
    await bun.load(project.path('src/app.ts'))

    expect((await bun.load(project.path('src/index.css')))?.contents).toContain('8px')
  })

  it('picks up a config edit when the same plugin runs a second build', async () => {
    const project = createProject()
    dir = project.dir
    const plugin = pandacss({ cwd: project.dir })

    await plugin.setup(createBun().builder)
    project.write('panda.config.ts', CONFIG.replace("outdir: 'styled-system'", "outdir: 'system'"))
    await plugin.setup(createBun().builder)

    expect(project.exists('system/css/index.js')).toBe(true)
  })

  it('picks up a source edit when the same plugin runs a second build', async () => {
    const project = createProject(`{ padding: '4px' }`)
    dir = project.dir
    const plugin = pandacss({ cwd: project.dir })

    const first = createBun()
    await plugin.setup(first.builder)
    expect((await first.load(project.path('src/index.css')))?.contents).toContain('4px')

    project.write('src/app.ts', app(`{ padding: '8px' }`))
    const second = createBun()
    await plugin.setup(second.builder)
    expect((await second.load(project.path('src/index.css')))?.contents).toContain('8px')
  })
})

describe('@pandacss/bun as a runtime plugin (bun run / bun test)', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
    vi.unstubAllGlobals()
  })

  it('writes the styled-system folder and registers no hooks without transform', async () => {
    const project = createProject()
    dir = project.dir

    const bun = await setupPlugin({ cwd: project.dir }, 'runtime')

    expect(project.exists('styled-system/css/index.js')).toBe(true)
    expect(bun.loads).toHaveLength(0)
    expect(bun.modules.size).toBe(0)
  })

  it('rewrites sources and serves the runtime through module() when transform is on', async () => {
    const project = createProject(`{ color: 'red' }`)
    dir = project.dir

    const bun = await setupPlugin({ cwd: project.dir, transform: true }, 'runtime')
    const rewritten = await bun.load(project.path('src/app.ts'))
    const runtime = await bun.modules.get('@pandacss-internal/css')?.()

    expect(rewritten?.contents).toContain('"color_red"')
    expect(runtime?.loader).toBe('js')
    expect(await bun.load(project.path('src/index.css'))).toBeUndefined()
  })

  it('echoes a source without Panda calls, since runtime loads must return contents', async () => {
    const project = createProject()
    dir = project.dir
    project.write('src/util.ts', 'export const n = 1\n')

    const bun = await setupPlugin({ cwd: project.dir, transform: true }, 'runtime')

    expect(await bun.load(project.path('src/util.ts'))).toEqual({ contents: 'export const n = 1\n', loader: 'ts' })
  })

  it('register() hands the plugin to Bun.plugin', async () => {
    const project = createProject()
    dir = project.dir
    const plugin = vi.fn(async () => undefined)
    vi.stubGlobal('Bun', { plugin })

    await register({ cwd: project.dir })

    expect(plugin).toHaveBeenCalledWith(expect.objectContaining({ name: 'pandacss' }))
  })

  it('register() refuses to run outside Bun', async () => {
    vi.stubGlobal('Bun', undefined)

    await expect(register()).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: @pandacss/bun: register() needs the Bun runtime. Pass pandacss() to Bun.build instead.]`,
    )
  })
})
