import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TransformSourceResult } from '@pandacss/compiler-shared'
import type { TransformSourceInput } from '@pandacss/transformer'

const CSS_ROOT = '@layer reset, base, tokens, recipes, utilities;'

interface TestPlugin {
  configResolved(config: unknown): Promise<void>
  transform: (
    this: { addWatchFile: (file: string) => void; warn: (message: string) => void },
    code: string,
    id: string,
  ) => unknown
  hotUpdate: (this: { environment: unknown }, ctx: unknown) => Promise<unknown>
}

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('@pandacss/vite design-system HMR', () => {
  it('watches design-system artifacts and source files from the CSS root', async () => {
    const { driver, pandacss } = await setup()
    const plugin = pandacss() as unknown as TestPlugin
    const addWatchFile = vi.fn()

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    plugin.transform.call({ addWatchFile, warn: vi.fn() }, CSS_ROOT, '/project/src/index.css')

    expect(addWatchFile.mock.calls.map(([file]) => file)).toMatchInlineSnapshot(`
      [
        "/project/src/app.tsx",
        "/project/src",
        "/project/panda.config.ts",
        "/project/node_modules/@acme/ds/panda/lib.json",
        "/project/node_modules/@acme/ds/panda/buildinfo.json",
        "/project/node_modules/@acme/ds/panda/preset.mjs",
        "/project/node_modules/@acme/ds/src/button.css.ts",
      ]
    `)
    expect(driver.cssgen).toHaveBeenCalledWith({ emitLayerDeclaration: false, polyfill: false })
  })

  it('registers new scan() matches on later CSS transforms without re-adding known files', async () => {
    const { driver, pandacss } = await setup()
    const plugin = pandacss() as unknown as TestPlugin
    const addWatchFile = vi.fn()
    const ctx = { addWatchFile, warn: vi.fn() }

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    plugin.transform.call(ctx, CSS_ROOT, '/project/src/index.css')
    expect(addWatchFile).toHaveBeenCalledWith('/project/src/app.tsx')

    addWatchFile.mockClear()
    driver.scan.mockReturnValueOnce(['/project/src/app.tsx', '/project/src/new.tsx'])
    plugin.transform.call(ctx, CSS_ROOT, '/project/src/index.css')

    expect(addWatchFile.mock.calls.map(([file]) => file)).toEqual(['/project/src/new.tsx'])
  })

  it('reloads design-system changes before returning component HMR modules', async () => {
    const { driver, pandacss } = await setup()
    const plugin = pandacss() as unknown as TestPlugin
    const rootModule = { id: '/project/src/index.css' }
    const componentModule = { id: '/project/node_modules/@acme/ds/src/button.tsx' }
    const invalidateModule = vi.fn()

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    plugin.transform.call({ addWatchFile: vi.fn(), warn: vi.fn() }, CSS_ROOT, '/project/src/index.css')

    const environment = {
      moduleGraph: {
        getModuleById: vi.fn((id) => (id === rootModule.id ? rootModule : undefined)),
        invalidateModule,
      },
    }
    const modules = await plugin.hotUpdate.call(
      { environment },
      {
        type: 'update',
        file: '/project/node_modules/@acme/ds/src/button.css.ts',
        modules: [componentModule],
        read: async () => "import { css } from '@acme/ds/css'\nexport const button = css({ fontSize: '20px' })",
        server: {
          config: { logger: { warn: vi.fn() } },
          environments: { client: environment },
        },
      },
    )

    expect(driver.syncDesignSystemFileChange).toHaveBeenCalledWith({
      path: '/project/node_modules/@acme/ds/src/button.css.ts',
      kind: 'change',
      content: "import { css } from '@acme/ds/css'\nexport const button = css({ fontSize: '20px' })",
    })
    expect(driver.reload).not.toHaveBeenCalled()
    expect(driver.applyChange).not.toHaveBeenCalled()
    expect(invalidateModule).toHaveBeenCalledWith(rootModule)
    expect(modules).toMatchInlineSnapshot(`
      [
        {
          "id": "/project/src/index.css",
        },
        {
          "id": "/project/node_modules/@acme/ds/src/button.tsx",
        },
      ]
    `)
  })

  it('regenerates codegen when a design-system artifact changes', async () => {
    const { driver, pandacss } = await setup()
    const plugin = pandacss({ outdir: 'styled-system' }) as unknown as TestPlugin
    const environment = createEnvironment()
    driver.isDesignSystemFile.mockReturnValue('artifact')
    driver.syncDesignSystemFileChange.mockResolvedValue(true)

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    driver.codegen.mockClear()
    await plugin.hotUpdate.call(
      { environment },
      artifactHotUpdate('/project/node_modules/@acme/ds/panda/lib.json', environment),
    )

    expect(driver.syncDesignSystemFileChange).toHaveBeenCalledWith({
      path: '/project/node_modules/@acme/ds/panda/lib.json',
      kind: 'change',
    })
    expect(driver.codegen).toHaveBeenCalledWith({ cwd: '/project', outdir: 'styled-system' })
  })

  it('skips codegen when a design-system artifact is unchanged', async () => {
    const { driver, pandacss } = await setup()
    const plugin = pandacss() as unknown as TestPlugin
    const environment = createEnvironment()
    driver.isDesignSystemFile.mockReturnValue('artifact')
    driver.syncDesignSystemFileChange.mockResolvedValue(false)

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    driver.codegen.mockClear()
    await plugin.hotUpdate.call(
      { environment },
      artifactHotUpdate('/project/node_modules/@acme/ds/panda/lib.json', environment),
    )

    expect(driver.codegen).not.toHaveBeenCalled()
  })

  it('skips codegen when a design-system source file changes', async () => {
    const { driver, pandacss } = await setup()
    const plugin = pandacss() as unknown as TestPlugin
    const environment = createEnvironment()
    driver.syncDesignSystemFileChange.mockResolvedValue(true)

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    driver.codegen.mockClear()
    await plugin.hotUpdate.call(
      { environment },
      {
        ...artifactHotUpdate('/project/node_modules/@acme/ds/src/button.css.ts', environment),
        read: async () => "export const button = css({ fontSize: '20px' })",
      },
    )

    expect(driver.syncDesignSystemFileChange).toHaveBeenCalledWith({
      path: '/project/node_modules/@acme/ds/src/button.css.ts',
      kind: 'change',
      content: "export const button = css({ fontSize: '20px' })",
    })
    expect(driver.codegen).not.toHaveBeenCalled()
  })

  it.each([
    ['create', 'add', true],
    ['update', 'change', true],
    ['delete', 'unlink', false],
  ] as const)('maps Vite %s events to Panda %s changes', async (type, kind, readsSource) => {
    const { driver, pandacss } = await setup()
    const plugin = pandacss() as unknown as TestPlugin
    const environment = {
      moduleGraph: {
        getModuleById: vi.fn(),
        invalidateModule: vi.fn(),
      },
    }
    const read = vi.fn(async () => "export const cls = css({ color: 'red' })")
    driver.isSourceFile.mockReturnValue(true)

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    await plugin.hotUpdate.call(
      { environment },
      {
        type,
        file: '/project/src/app.tsx',
        modules: [],
        read,
        server: {
          config: { logger: { warn: vi.fn() } },
          environments: { client: environment },
        },
      },
    )

    expect(driver.applyChange).toHaveBeenCalledWith({
      path: '/project/src/app.tsx',
      kind,
      ...(readsSource ? { content: "export const cls = css({ color: 'red' })" } : {}),
    })
    expect(read).toHaveBeenCalledTimes(readsSource ? 1 : 0)
  })

  it('invalidates the stylesheet root in a non-client environment without touching the shared driver', async () => {
    const { driver, pandacss } = await setup()
    const plugin = pandacss() as unknown as TestPlugin
    const root = { id: '/project/src/index.css' }
    const client = { moduleGraph: {} }
    const ssr = {
      moduleGraph: {
        getModuleById: vi.fn((id: string) => (id === root.id ? root : undefined)),
        invalidateModule: vi.fn(),
      },
    }
    driver.isSourceFile.mockImplementation((file: string): boolean => file === '/project/src/app.tsx')

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    plugin.transform.call({ addWatchFile: vi.fn(), warn: vi.fn() }, CSS_ROOT, '/project/src/index.css')

    const untouched = await plugin.hotUpdate.call(
      { environment: ssr },
      { type: 'delete', file: '/project/README.md', modules: [], read: vi.fn(), server: { environments: { client } } },
    )
    expect(untouched).toEqual([])
    expect(ssr.moduleGraph.invalidateModule).not.toHaveBeenCalled()

    const modules = await plugin.hotUpdate.call(
      { environment: ssr },
      {
        type: 'delete',
        file: '/project/src/app.tsx',
        modules: [],
        read: vi.fn(),
        server: { environments: { client } },
      },
    )

    expect(driver.applyChange).not.toHaveBeenCalled()
    expect(ssr.moduleGraph.invalidateModule).toHaveBeenCalledWith(root)
    expect(modules).toEqual([root])
  })

  it('skips source rewrite by default', async () => {
    const { createSourceTransformer, pandacss } = await setup()
    const plugin = pandacss() as unknown as TestPlugin
    const warn = vi.fn()

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    expect(createSourceTransformer).not.toHaveBeenCalled()

    const result = plugin.transform.call(
      { addWatchFile: vi.fn(), warn },
      "import { css } from '@panda/css'\nexport const cls = css({ color: 'red' })",
      '/project/src/app.tsx',
    )

    expect(result).toBeNull()
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns on source-transform diagnostics and returns transformed code when enabled', async () => {
    const { createSourceTransformer, driver, pandacss } = await setup()
    const plugin = pandacss({ transform: true }) as unknown as TestPlugin
    const warn = vi.fn()

    driver.sourceTransformer.transformSource.mockReturnValueOnce({
      code: 'export const cls = "color_red"',
      map: 'source-map',
      changed: true,
      bailed: false,
      diagnostics: [
        {
          code: 'panda-transform-warning',
          severity: 'warning',
          message: 'transformed with a warning',
        },
      ],
      dependencies: ['/project/theme.ts'],
      helper: { needsCx: false, needsCva: false, needsSva: false },
    })

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    expect(createSourceTransformer).toHaveBeenCalledWith(driver.compiler)
    const result = plugin.transform.call(
      { addWatchFile: vi.fn(), warn },
      "import { css } from '@panda/css'\nexport const cls = css({ color: 'red' })",
      '/project/src/app.tsx',
    )

    expect(warn.mock.calls[0]?.[0]).toMatchInlineSnapshot(`
      "panda: 1 diagnostic(s) while transforming source
      warning panda-transform-warning /project/src/app.tsx transformed with a warning"
    `)
    expect(result).toMatchInlineSnapshot(`
      {
        "code": "export const cls = "color_red"",
        "map": "source-map",
      }
    `)
  })

  it('rebuilds the cached source transformer after a compiler reload', async () => {
    const { createSourceTransformer, driver, pandacss } = await setup()
    const plugin = pandacss({ transform: true }) as unknown as TestPlugin
    const nextCompiler = { ...driver.compiler }
    const nextTransformer = {
      transformSource: vi.fn(() => ({
        code: "export const cls = 'next'",
        map: null,
        changed: true,
        bailed: false,
        diagnostics: [],
        dependencies: [],
        helper: { needsCx: false, needsCva: false, needsSva: false },
      })),
    }

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    createSourceTransformer.mockReturnValueOnce(nextTransformer)
    driver.compiler = nextCompiler

    const result = plugin.transform.call(
      { addWatchFile: vi.fn(), warn: vi.fn() },
      "import { css } from '@panda/css'\nexport const cls = css({ color: 'red' })",
      '/project/src/app.tsx',
    )

    expect(createSourceTransformer).toHaveBeenLastCalledWith(nextCompiler)
    expect(nextTransformer.transformSource).toHaveBeenCalledOnce()
    expect(result).toMatchInlineSnapshot(`
      {
        "code": "export const cls = 'next'",
        "map": null,
      }
    `)
  })
})

async function setup() {
  const driver = createMockDriver()
  const createNodeDriver = vi.fn(async () => driver)
  const createSourceTransformer = vi.fn(() => driver.sourceTransformer)

  vi.doMock('@pandacss/compiler', () => ({
    createNodeDriver,
  }))
  vi.doMock('@pandacss/transformer', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@pandacss/transformer')>()),
    createSourceTransformer,
  }))

  const { pandacss } = await import('../src')

  return { createNodeDriver, createSourceTransformer, driver, pandacss }
}

function createEnvironment() {
  return {
    moduleGraph: {
      getModuleById: vi.fn(),
      invalidateModule: vi.fn(),
    },
  }
}

function artifactHotUpdate(file: string, environment: ReturnType<typeof createEnvironment>) {
  return {
    type: 'update',
    file,
    modules: [],
    read: vi.fn(),
    server: {
      config: { logger: { warn: vi.fn() } },
      environments: { client: environment },
    },
  }
}

function createMockDriver() {
  const sourceTransformer = {
    transformSource: vi.fn(
      (input: TransformSourceInput): TransformSourceResult => ({
        code: input.source,
        map: null,
        changed: false,
        bailed: false,
        diagnostics: [],
        dependencies: [],
        helper: { needsCx: false, needsCva: false, needsSva: false },
      }),
    ),
  }
  return {
    sourceTransformer,
    compiler: {
      hasLayerDeclaration: vi.fn((css: string) => css.includes('@layer')),
      stripLayerOrderStatements: vi.fn((css: string) =>
        css.replace(/@layer\s+reset,\s*base,\s*tokens,\s*recipes,\s*utilities;/g, ''),
      ),
      getFile: vi.fn(() => ({ diagnostics: [] })),
    },
    config: {},
    configPath: '/project/panda.config.ts',
    designSystemDiagnostics: [],
    applyChange: vi.fn(() => true),
    codegen: vi.fn(),
    cssgen: vi.fn(() => ({ css: '.fs_20px { font-size: 20px }', diagnostics: [] })),
    designSystemWatchTargets: vi.fn(() => [
      {
        name: '@acme/ds',
        manifestPath: '/project/node_modules/@acme/ds/panda/lib.json',
        buildInfoPath: '/project/node_modules/@acme/ds/panda/buildinfo.json',
        presetPath: '/project/node_modules/@acme/ds/panda/preset.mjs',
        sourceFiles: ['/project/node_modules/@acme/ds/src/button.css.ts'],
      },
    ]),
    isConfigFile: vi.fn(() => false),
    isDesignSystemFile: vi.fn((file: string): 'artifact' | 'source' | false =>
      file === '/project/node_modules/@acme/ds/src/button.css.ts' ? 'source' : false,
    ),
    isSourceFile: vi.fn((_file: string) => false),
    parseFiles: vi.fn(),
    reload: vi.fn(async () => ({ hasChanged: true, dependencies: [], recipes: [], patterns: [], changes: [] })),
    scan: vi.fn(() => ['/project/src/app.tsx']),
    watchTargets: vi.fn(() => ({ sources: ['src/**/*.tsx'], dirs: ['/project/src'], config: ['panda.config.ts'] })),
    resolvePath: vi.fn((file: string) => (file.startsWith('/') ? file : `/project/${file}`)),
    syncDesignSystemFileChange: vi.fn(async () => true),
  }
}
