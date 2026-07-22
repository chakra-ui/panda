import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PandaWebpackPlugin } from '../src'

const CSS_ROOT = '@layer reset, base, tokens, recipes, utilities;'

interface LoaderThis {
  getOptions: () => { getDriver: () => unknown }
  addDependency: (file: string) => void
  emitWarning: (error: Error) => void
}

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('@pandacss/webpack design-system watch', () => {
  it('registers design-system artifacts and source files from the CSS root', async () => {
    const { driver, pandaCssLoader } = await setupLoader()
    const addDependency = vi.fn()
    const emitWarning = vi.fn()

    const result = pandaCssLoader.call(
      {
        getOptions: () => ({ getDriver: () => driver }),
        addDependency,
        emitWarning,
      } satisfies LoaderThis,
      CSS_ROOT,
    )

    expect(addDependency.mock.calls.map(([file]) => file)).toMatchInlineSnapshot(`
      [
        "/project/src/app.tsx",
        "/project/panda.config.ts",
        "/project/node_modules/@acme/ds/panda/lib.json",
        "/project/node_modules/@acme/ds/panda/buildinfo.json",
        "/project/node_modules/@acme/ds/panda/preset.mjs",
        "/project/node_modules/@acme/ds/src/button.css.ts",
      ]
    `)
    expect(driver.cssgen).toHaveBeenCalledWith({ emitLayerDeclaration: false, polyfill: false })
    expect(emitWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('while loading the design system'),
      }),
    )
    expect(result).toContain('.fs_20px { font-size: 20px }')
  })

  it('syncs design-system file changes on watchRun before modules rebuild', async () => {
    const { driver, PandaWebpackPlugin } = await setupPlugin()
    const { watchRun, warn } = applyPlugin(new PandaWebpackPlugin({ cwd: '/project' }))

    await watchRun?.({
      modifiedFiles: new Set(['/project/node_modules/@acme/ds/src/button.css.ts']),
    })

    expect(driver.syncDesignSystemFileChange).toHaveBeenCalledWith({
      path: '/project/node_modules/@acme/ds/src/button.css.ts',
      kind: 'change',
    })
    expect(driver.reload).not.toHaveBeenCalled()
    expect(driver.applyChange).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('while loading the design system'))
  })

  it('does not apply the source transformer by default', async () => {
    const webpackApply = vi.fn()
    const driver = createMockDriver()

    vi.doMock('@pandacss/compiler', () => ({
      createNodeDriver: vi.fn(async () => driver),
    }))
    vi.doMock('@pandacss/transformer', () => ({
      pandaTransformer: {
        webpack: () => ({
          apply: webpackApply,
        }),
      },
    }))

    const { PandaWebpackPlugin } = await import('../src')
    applyPlugin(new PandaWebpackPlugin({ cwd: '/project' }))
    expect(webpackApply).not.toHaveBeenCalled()
  })

  it('applies the source transformer when transform is enabled', async () => {
    const webpackApply = vi.fn()
    const driver = createMockDriver()

    vi.doMock('@pandacss/compiler', () => ({
      createNodeDriver: vi.fn(async () => driver),
    }))
    vi.doMock('@pandacss/transformer', () => ({
      pandaTransformer: {
        webpack: () => ({
          apply: webpackApply,
        }),
      },
    }))

    const { PandaWebpackPlugin } = await import('../src')
    applyPlugin(new PandaWebpackPlugin({ cwd: '/project', transform: true }))
    expect(webpackApply).toHaveBeenCalledTimes(1)
  })

  it('prefers design-system sync over config reload for artifact paths', async () => {
    const { driver, PandaWebpackPlugin } = await setupPlugin()
    driver.isConfigFile.mockImplementation((file?: string): boolean => {
      return file === '/project/node_modules/@acme/ds/panda/buildinfo.json'
    })
    driver.isDesignSystemFile.mockImplementation((file: string): false | 'artifact' | 'source' => {
      return file === '/project/node_modules/@acme/ds/panda/buildinfo.json' ? 'artifact' : false
    })

    const { watchRun } = applyPlugin(new PandaWebpackPlugin({ cwd: '/project' }))

    await watchRun?.({
      modifiedFiles: new Set(['/project/node_modules/@acme/ds/panda/buildinfo.json']),
    })

    expect(driver.syncDesignSystemFileChange).toHaveBeenCalledWith({
      path: '/project/node_modules/@acme/ds/panda/buildinfo.json',
      kind: 'change',
    })
    expect(driver.reload).not.toHaveBeenCalled()
  })
})

async function setupLoader() {
  const driver = createMockDriver()
  vi.doMock('@pandacss/compiler', () => ({
    createNodeDriver: vi.fn(async () => driver),
  }))

  const mod = await import('../src/css-loader')
  const pandaCssLoader = mod.default as (this: LoaderThis, source: string) => string
  return { driver, pandaCssLoader }
}

async function setupPlugin() {
  const driver = createMockDriver()

  vi.doMock('@pandacss/compiler', () => ({
    createNodeDriver: vi.fn(async () => driver),
  }))
  vi.doMock('@pandacss/transformer', () => ({
    pandaTransformer: {
      webpack: () => ({
        apply: vi.fn(),
      }),
    },
  }))

  const { PandaWebpackPlugin } = await import('../src')
  return { driver, PandaWebpackPlugin }
}

function applyPlugin(plugin: PandaWebpackPlugin) {
  const warn = vi.fn()
  let watchRun: ((compiler: { modifiedFiles?: Set<string> }) => Promise<void>) | undefined

  plugin.apply({
    context: '/project',
    options: { module: { rules: [] } },
    getInfrastructureLogger: () => ({ warn }),
    hooks: {
      beforeCompile: { tapPromise: vi.fn() },
      watchRun: {
        tapPromise: (_name: string, fn: typeof watchRun) => {
          watchRun = fn
        },
      },
    },
  } as never)

  return { watchRun, warn }
}

function createMockDriver() {
  return {
    compiler: {
      hasLayerDeclaration: vi.fn((css: string) => css.includes('@layer')),
      stripLayerOrderStatements: vi.fn((css: string) =>
        css.replace(/@layer\s+reset,\s*base,\s*tokens,\s*recipes,\s*utilities;/g, ''),
      ),
      getFile: vi.fn(() => ({ diagnostics: [] })),
    },
    config: {},
    configPath: '/project/panda.config.ts',
    designSystemDiagnostics: [
      {
        severity: 'warning' as const,
        code: 'design_system_token_conflict',
        message: 'token conflict in design system',
      },
    ],
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
    isConfigFile: vi.fn((_file?: string) => false),
    isDesignSystemFile: vi.fn((file: string): false | 'artifact' | 'source' =>
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
