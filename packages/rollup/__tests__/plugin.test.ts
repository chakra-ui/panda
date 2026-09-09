import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createNodeDriver: vi.fn(),
  transformer: vi.fn(() => []),
}))

vi.mock('@pandacss/compiler', () => ({ createNodeDriver: mocks.createNodeDriver }))
vi.mock('@pandacss/transformer', () => ({
  pandaTransformer: { rollup: mocks.transformer },
}))

import { pandacss } from '../src'

interface TestPlugin {
  buildStart(this: TestContext): Promise<void>
  watchChange(id: string, change: { event: 'create' | 'delete' | 'update' }): Promise<void>
  generateBundle(this: TestContext, output: { dir?: string; file?: string }): Promise<void>
}

interface TestContext {
  addWatchFile: ReturnType<typeof vi.fn>
  emitFile: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.transformer.mockReturnValue([])
})

describe('@pandacss/rollup', () => {
  it('stops before emitting CSS when compilation fails', async () => {
    const driver = createDriver([{ severity: 'error', code: 'config_load_error', message: 'bad config' }])
    mocks.createNodeDriver.mockResolvedValue(driver)
    const plugin = pandacss()[0] as unknown as TestPlugin
    const context = createContext()

    await plugin.buildStart.call(context)

    await expect(plugin.generateBundle.call(context, {})).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: error config_load_error bad config]`,
    )
    expect(context.emitFile).not.toHaveBeenCalled()
  })

  it('reports warning and info diagnostics through Rollup', async () => {
    const driver = createDriver([
      { severity: 'warning', code: 'js_parse_error', message: 'partial extraction' },
      { severity: 'info', code: 'design_system_token_conflict', message: 'local token wins' },
    ])
    mocks.createNodeDriver.mockResolvedValue(driver)
    const plugin = pandacss()[0] as unknown as TestPlugin
    const context = createContext()

    await plugin.buildStart.call(context)
    await plugin.generateBundle.call(context, {})

    expect({
      warnings: context.warn.mock.calls,
      info: context.info.mock.calls,
      emitted: context.emitFile.mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "emitted": [
          [
            {
              "fileName": "panda.css",
              "source": ".generated { color: red }",
              "type": "asset",
            },
          ],
        ],
        "info": [
          [
            "info design_system_token_conflict local token wins",
          ],
        ],
        "warnings": [
          [
            "warning js_parse_error partial extraction",
          ],
        ],
      }
    `)
  })

  it('watches source directories, config dependencies, and design-system files', async () => {
    const driver = createDriver([])
    mocks.createNodeDriver.mockResolvedValue(driver)
    const plugin = pandacss()[0] as unknown as TestPlugin
    const context = createContext()

    await plugin.buildStart.call(context)

    expect(driver.scan).not.toHaveBeenCalled()
    expect(context.addWatchFile.mock.calls.map(([file]) => file)).toMatchInlineSnapshot(`
      [
        "/project/src",
        "/project/panda.shared.ts",
        "/project/panda.config.ts",
        "/project/src/app.tsx",
        "/project/node_modules/@acme/ds/panda/lib.json",
        "/project/node_modules/@acme/ds/panda/buildinfo.json",
        "/project/node_modules/@acme/ds/panda/preset.mjs",
        "/project/node_modules/@acme/ds/src/button.tsx",
      ]
    `)
  })

  it('scans for watch files when a custom driver does not expose parsed files', async () => {
    const driver = createDriver([])
    driver.watchTargets.mockReturnValue({
      files: undefined,
      dirs: ['/project/src'],
      config: ['/project/panda.shared.ts'],
      sources: [],
    })
    mocks.createNodeDriver.mockResolvedValue(driver)

    await (pandacss()[0] as unknown as TestPlugin).buildStart.call(createContext())

    expect(driver.scan).toHaveBeenCalledOnce()
  })

  it.each([
    ['create', 'add'],
    ['update', 'change'],
    ['delete', 'unlink'],
  ] as const)('maps Rollup %s events to Panda %s changes', async (event, kind) => {
    const driver = createDriver([])
    driver.isSourceFile.mockReturnValue(true)
    mocks.createNodeDriver.mockResolvedValue(driver)
    const plugin = pandacss()[0] as unknown as TestPlugin

    await plugin.buildStart.call(createContext())
    await plugin.watchChange('/project/src/app.tsx', { event })

    expect(driver.applyChange).toHaveBeenCalledWith({ path: '/project/src/app.tsx', kind })
  })

  it('regenerates codegen when a design-system artifact changes', async () => {
    const driver = createDriver([])
    driver.isDesignSystemFile.mockReturnValue('artifact')
    driver.syncDesignSystemFileChange.mockResolvedValue(true)
    mocks.createNodeDriver.mockResolvedValue(driver)
    const plugin = pandacss({ cwd: '/project', outdir: 'styled-system' })[0] as unknown as TestPlugin

    await plugin.buildStart.call(createContext())
    driver.codegen.mockClear()
    await plugin.watchChange('/project/node_modules/@acme/ds/panda/lib.json', { event: 'update' })

    expect(driver.syncDesignSystemFileChange).toHaveBeenCalledWith({
      path: '/project/node_modules/@acme/ds/panda/lib.json',
      kind: 'change',
    })
    expect(driver.codegen).toHaveBeenCalledWith({ cwd: '/project', outdir: 'styled-system' })
  })

  it('skips codegen when a design-system artifact is unchanged', async () => {
    const driver = createDriver([])
    driver.isDesignSystemFile.mockReturnValue('artifact')
    driver.syncDesignSystemFileChange.mockResolvedValue(false)
    mocks.createNodeDriver.mockResolvedValue(driver)
    const plugin = pandacss({ cwd: '/project', outdir: 'styled-system' })[0] as unknown as TestPlugin

    await plugin.buildStart.call(createContext())
    driver.codegen.mockClear()
    await plugin.watchChange('/project/node_modules/@acme/ds/panda/lib.json', { event: 'update' })

    expect(driver.codegen).not.toHaveBeenCalled()
  })

  it('skips codegen when a design-system source file changes', async () => {
    const driver = createDriver([])
    driver.isDesignSystemFile.mockReturnValue('source')
    driver.syncDesignSystemFileChange.mockResolvedValue(true)
    mocks.createNodeDriver.mockResolvedValue(driver)
    const plugin = pandacss({ cwd: '/project', outdir: 'styled-system' })[0] as unknown as TestPlugin

    await plugin.buildStart.call(createContext())
    driver.codegen.mockClear()
    await plugin.watchChange('/project/node_modules/@acme/ds/src/button.tsx', { event: 'update' })

    expect(driver.syncDesignSystemFileChange).toHaveBeenCalledWith({
      path: '/project/node_modules/@acme/ds/src/button.tsx',
      kind: 'change',
    })
    expect(driver.codegen).not.toHaveBeenCalled()
  })
})

function createDriver(diagnostics: Array<{ severity: 'error' | 'info' | 'warning'; code: string; message: string }>) {
  return {
    compiler: {},
    configPath: '/project/panda.config.ts',
    applyChange: vi.fn(),
    codegen: vi.fn(),
    parseFiles: vi.fn(),
    scan: vi.fn(() => ['/project/src/app.tsx']),
    cssgen: vi.fn(() => ({ css: '.generated { color: red }', diagnostics })),
    designSystemDiagnostics: [],
    designSystemWatchTargets: vi.fn(() => [
      {
        manifestPath: '/project/node_modules/@acme/ds/panda/lib.json',
        buildInfoPath: '/project/node_modules/@acme/ds/panda/buildinfo.json',
        presetPath: '/project/node_modules/@acme/ds/panda/preset.mjs',
        sourceFiles: ['/project/node_modules/@acme/ds/src/button.tsx'],
      },
    ]),
    isConfigFile: vi.fn(() => false),
    isDesignSystemFile: vi.fn((): 'artifact' | 'source' | false => false),
    isSourceFile: vi.fn(() => false),
    reload: vi.fn(),
    resolvePath: vi.fn((path: string) => path),
    syncDesignSystemFileChange: vi.fn(async (): Promise<boolean> => false),
    watchTargets: vi.fn(() => ({
      files: ['/project/src/app.tsx'] as string[] | undefined,
      dirs: ['/project/src'],
      config: ['/project/panda.shared.ts'],
      sources: [],
    })),
  }
}

function createContext(): TestContext {
  return {
    addWatchFile: vi.fn(),
    emitFile: vi.fn(),
    error: vi.fn((message: string) => {
      throw new Error(message)
    }),
    info: vi.fn(),
    warn: vi.fn(),
  }
}
