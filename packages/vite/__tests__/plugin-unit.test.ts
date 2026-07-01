import { afterEach, describe, expect, it, vi } from 'vitest'

const CSS_ROOT = '@layer reset, base, tokens, recipes, utilities;'

interface TestPlugin {
  configResolved(config: unknown): Promise<void>
  transform: (
    this: { addWatchFile: (file: string) => void; warn: (message: string) => void },
    code: string,
    id: string,
  ) => unknown
  handleHotUpdate(ctx: unknown): Promise<unknown>
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
        "/project/panda.config.ts",
        "/project/node_modules/@acme/ds/panda.lib.json",
        "/project/node_modules/@acme/ds/panda.buildinfo.json",
        "/project/node_modules/@acme/ds/preset.mjs",
        "/project/node_modules/@acme/ds/src/button.css.ts",
      ]
    `)
    expect(driver.cssgen).toHaveBeenCalledWith({ emitLayerDeclaration: false })
  })

  it('reloads design-system changes before returning component HMR modules', async () => {
    const { driver, pandacss } = await setup()
    const plugin = pandacss() as unknown as TestPlugin
    const rootModule = { id: '/project/src/index.css' }
    const componentModule = { id: '/project/node_modules/@acme/ds/src/button.tsx' }
    const invalidateModule = vi.fn()

    await plugin.configResolved({ root: '/project', logger: { warn: vi.fn() } })
    plugin.transform.call({ addWatchFile: vi.fn(), warn: vi.fn() }, CSS_ROOT, '/project/src/index.css')

    const modules = await plugin.handleHotUpdate({
      file: '/project/node_modules/@acme/ds/src/button.css.ts',
      modules: [componentModule],
      read: async () => "import { css } from '@acme/ds/css'\nexport const button = css({ fontSize: '20px' })",
      server: {
        config: { logger: { warn: vi.fn() } },
        moduleGraph: {
          getModuleById: vi.fn((id) => (id === rootModule.id ? rootModule : undefined)),
          invalidateModule,
        },
      },
    })

    expect(driver.syncDesignSystemFileChange).toHaveBeenCalledWith({
      path: '/project/node_modules/@acme/ds/src/button.css.ts',
      kind: 'change',
      content: "import { css } from '@acme/ds/css'\nexport const button = css({ fontSize: '20px' })",
    })
    expect(driver.reload).not.toHaveBeenCalled()
    expect(driver.applyChange).not.toHaveBeenCalled()
    expect(invalidateModule).toHaveBeenCalledWith(rootModule)
    expect(modules).toEqual([rootModule, componentModule])
  })
})

async function setup() {
  const driver = createMockDriver()
  const createNodeDriver = vi.fn(async () => driver)

  vi.doMock('@pandacss/compiler', () => ({
    createNodeDriver,
  }))

  const { pandacss } = await import('../src')

  return { createNodeDriver, driver, pandacss }
}

function createMockDriver() {
  return {
    compiler: {
      hasLayerDeclaration: vi.fn((css: string) => css.includes('@layer')),
      getFile: vi.fn(() => ({ diagnostics: [] })),
    },
    configPath: '/project/panda.config.ts',
    designSystemDiagnostics: [],
    applyChange: vi.fn(() => true),
    codegen: vi.fn(),
    cssgen: vi.fn(() => ({ css: '.fs_20px { font-size: 20px }', diagnostics: [] })),
    designSystemWatchTargets: vi.fn(() => [
      {
        name: '@acme/ds',
        manifestPath: '/project/node_modules/@acme/ds/panda.lib.json',
        buildInfoPath: '/project/node_modules/@acme/ds/panda.buildinfo.json',
        presetPath: '/project/node_modules/@acme/ds/preset.mjs',
        sourceFiles: ['/project/node_modules/@acme/ds/src/button.css.ts'],
      },
    ]),
    isConfigFile: vi.fn(() => false),
    isDesignSystemFile: vi.fn((file: string) =>
      file === '/project/node_modules/@acme/ds/src/button.css.ts' ? 'source' : false,
    ),
    isSourceFile: vi.fn(() => false),
    parseFiles: vi.fn(),
    reload: vi.fn(async () => ({ hasChanged: true, dependencies: [], recipes: [], patterns: [], changes: [] })),
    scan: vi.fn(() => ['/project/src/app.tsx']),
    watchTargets: vi.fn(() => ({ sources: ['src/**/*.tsx'], dirs: ['/project/src'], config: ['panda.config.ts'] })),
    resolvePath: vi.fn((file: string) => (file.startsWith('/') ? file : `/project/${file}`)),
    syncDesignSystemFileChange: vi.fn(async () => true),
  }
}
