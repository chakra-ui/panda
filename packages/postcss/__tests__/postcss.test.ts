import postcss from 'postcss'
import { afterEach, describe, expect, it, vi } from 'vitest'

const PROJECT_CWD = '/project'
const INPUT = '@layer reset, base, tokens, recipes, utilities;'

interface MockDriver {
  compiler: {
    hasLayerDeclaration: ReturnType<typeof vi.fn>
    sources: ReturnType<typeof vi.fn>
  }
  applyChanges: ReturnType<typeof vi.fn>
  configDependencies: string[]
  configPath: string
  codegen: ReturnType<typeof vi.fn>
  cssgen: ReturnType<typeof vi.fn>
  designSystemDiagnostics: Array<{ severity: 'warning' | 'error'; code: string; message: string }>
  designSystemWatchTargets: ReturnType<typeof vi.fn>
  getOutdir: ReturnType<typeof vi.fn>
  isDesignSystemFile: ReturnType<typeof vi.fn>
  parseFiles: ReturnType<typeof vi.fn>
  reload: ReturnType<typeof vi.fn>
  scan: ReturnType<typeof vi.fn>
  syncDesignSystemFileChange: ReturnType<typeof vi.fn>
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('@pandacss/postcss', () => {
  it('skips node_modules CSS files by default', async () => {
    const { createNodeDriver, run } = await setup()

    const result = await run(INPUT, {}, '/project/node_modules/pkg/styles.css')

    expect(result.css).toMatchInlineSnapshot(`"@layer reset, base, tokens, recipes, utilities;"`)
    expect(createNodeDriver).not.toHaveBeenCalled()
  })

  it('allows configured node_modules CSS files through the guard', async () => {
    const { createNodeDriver, run } = await setup()

    await run(INPUT, { allow: [/node_modules\/pkg/] }, '/project/node_modules/pkg/styles.css')

    expect(createNodeDriver).toHaveBeenCalledTimes(1)
  })

  it('skips non-CSS files', async () => {
    const { createNodeDriver, run } = await setup()

    const result = await run(INPUT, {}, '/project/styles.js')

    expect(result.css).toMatchInlineSnapshot(`"@layer reset, base, tokens, recipes, utilities;"`)
    expect(createNodeDriver).not.toHaveBeenCalled()
  })

  it('skips stylesheets without any layer at-rule before loading the driver', async () => {
    const { createNodeDriver, run } = await setup()
    const input = '.btn { color: red }'

    const result = await run(input)

    expect(result.css).toMatchInlineSnapshot(`".btn { color: red }"`)
    expect(createNodeDriver).not.toHaveBeenCalled()
  })

  it('uses the compiler layer check before injecting generated CSS', async () => {
    const { driver, run } = await setup()
    driver.compiler.hasLayerDeclaration.mockReturnValue(false)

    const result = await run('@layer base { .btn { color: red } }')

    expect(result.css).toMatchInlineSnapshot(`"@layer base { .btn { color: red } }"`)
    expect(driver.codegen).not.toHaveBeenCalled()
    expect(driver.parseFiles).not.toHaveBeenCalled()
  })

  it('processes the stylesheet root and registers watch dependencies', async () => {
    const { driver, run } = await setup()

    const result = await run(INPUT)

    expect(driver.codegen).toHaveBeenCalledWith({ cwd: PROJECT_CWD, outdir: undefined })
    expect(driver.scan).toHaveBeenCalledTimes(1)
    expect(driver.applyChanges).toHaveBeenCalledWith([{ path: '/project/src/App.tsx', kind: 'add' }])
    expect(driver.parseFiles).not.toHaveBeenCalled()
    expect(driver.cssgen).toHaveBeenCalledWith({ emitLayerDeclaration: false })
    expect(result.css).toMatchInlineSnapshot(
      `"@layer reset, base, tokens, recipes, utilities;.text_red { color: red }"`,
    )
    expect(result.messages).toMatchInlineSnapshot(`
      [
        {
          "dir": "/project/src",
          "glob": "**/*.tsx",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dir-dependency",
        },
        {
          "file": "/project/panda.config.ts",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
        {
          "file": "/project/panda.tokens.ts",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
      ]
    `)
  })

  it('emits compiler warnings with severity and code', async () => {
    const { driver, run } = await setup()
    driver.cssgen.mockReturnValueOnce({
      css: '.text_red { color: red }',
      manifest: { files: [], tokens: [] },
      layerRanges: {},
      diagnostics: [{ severity: 'warning', code: 'panda_call_unextractable', message: 'dynamic style value' }],
    })

    const result = await run(INPUT)

    expect(result.warnings().map((warning) => warning.text)).toMatchInlineSnapshot(`
      [
        "warning panda_call_unextractable dynamic style value",
      ]
    `)
  })

  it('emits design-system diagnostics with severity and code', async () => {
    const { driver, run } = await setup()
    driver.designSystemDiagnostics = [
      {
        severity: 'warning',
        code: 'design_system_token_conflict',
        message: 'Token "colors.brand" is defined by both "@acme/ds" and this config; the local value wins.',
      },
    ]

    const result = await run(INPUT)

    expect(result.warnings().map((warning) => warning.text)).toMatchInlineSnapshot(`
      [
        "warning design_system_token_conflict Token "colors.brand" is defined by both "@acme/ds" and this config; the local value wins.",
      ]
    `)
  })

  it('registers design-system artifact and source file dependencies', async () => {
    const { driver, run } = await setup()
    driver.designSystemWatchTargets.mockReturnValueOnce([
      {
        name: '@acme/ds',
        manifestPath: '/project/node_modules/@acme/ds/panda.lib.json',
        buildInfoPath: '/project/node_modules/@acme/ds/panda.buildinfo.json',
        presetPath: '/project/node_modules/@acme/ds/panda.preset.mjs',
        sourceFiles: ['/project/node_modules/@acme/ds/src/button.tsx'],
      },
    ])

    const result = await run(INPUT)

    expect(result.messages.filter((message) => message.type === 'dependency')).toMatchInlineSnapshot(`
      [
        {
          "file": "/project/panda.config.ts",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
        {
          "file": "/project/panda.tokens.ts",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
        {
          "file": "/project/node_modules/@acme/ds/panda.lib.json",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
        {
          "file": "/project/node_modules/@acme/ds/panda.buildinfo.json",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
        {
          "file": "/project/node_modules/@acme/ds/panda.preset.mjs",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
        {
          "file": "/project/node_modules/@acme/ds/src/button.tsx",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
      ]
    `)
  })

  it('throws compiler errors through PostCSS', async () => {
    const { driver, run } = await setup()
    driver.cssgen.mockReturnValueOnce({
      css: '',
      manifest: { files: [], tokens: [] },
      layerRanges: {},
      diagnostics: [{ severity: 'error', code: 'config_load_error', message: 'bad config' }],
    })

    await expect(run(INPUT)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[CssSyntaxError: pandacss: /project/styles.css:1:1: error config_load_error bad config]`,
    )
  })

  it('warns on a parse error instead of failing the build', async () => {
    const { driver, run } = await setup()
    driver.cssgen.mockReturnValueOnce({
      css: '.text_red { color: red }',
      manifest: { files: [], tokens: [] },
      layerRanges: {},
      diagnostics: [
        {
          severity: 'warning',
          code: 'js_parse_error',
          message: 'Unexpected token. Panda could not fully parse this file; some styles may be missing.',
        },
      ],
    })

    const result = await run(INPUT)

    expect(result.warnings().map((warning) => warning.text)).toMatchInlineSnapshot(`
      [
        "warning js_parse_error Unexpected token. Panda could not fully parse this file; some styles may be missing.",
      ]
    `)
  })

  it('uses dependency messages for source directories in Rollup watch mode', async () => {
    vi.stubEnv('ROLLUP_WATCH', 'true')
    const { run } = await setup()

    const result = await run(INPUT)

    expect(result.messages).toMatchInlineSnapshot(`
      [
        {
          "file": "/project/src",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
        {
          "file": "/project/panda.config.ts",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
        {
          "file": "/project/panda.tokens.ts",
          "parent": "/project/styles.css",
          "plugin": "pandacss",
          "type": "dependency",
        },
      ]
    `)
  })

  it('reloads an existing driver and regenerates artifacts only when config changes', async () => {
    const { createNodeDriver, driver, pandacss } = await setup()
    const processor = postcss([pandacss({ cwd: PROJECT_CWD })])

    await processor.process(INPUT, { from: '/project/one.css' })
    await processor.process(INPUT, { from: '/project/two.css' })

    expect(createNodeDriver).toHaveBeenCalledTimes(1)
    expect(driver.reload).toHaveBeenCalledTimes(1)
    expect(driver.codegen).toHaveBeenCalledTimes(1)

    driver.reload.mockResolvedValueOnce({ hasChanged: true, dependencies: [], recipes: [], patterns: [], changes: [] })
    await processor.process(INPUT, { from: '/project/three.css' })

    expect(driver.reload).toHaveBeenCalledTimes(2)
    expect(driver.codegen).toHaveBeenCalledTimes(2)
  })

  it('refreshes known source files additively on repeated transforms', async () => {
    const { driver, pandacss } = await setup()
    const processor = postcss([pandacss({ cwd: PROJECT_CWD })])

    await processor.process(INPUT, { from: '/project/styles.css' })
    await processor.process(INPUT, { from: '/project/styles.css' })

    expect(driver.applyChanges).toHaveBeenNthCalledWith(1, [{ path: '/project/src/App.tsx', kind: 'add' }])
    expect(driver.applyChanges).toHaveBeenNthCalledWith(2, [{ path: '/project/src/App.tsx', kind: 'change' }])
    expect(driver.parseFiles).not.toHaveBeenCalled()
  })

  it('removes source files that disappear from the scan', async () => {
    const { driver, pandacss } = await setup()
    driver.scan
      .mockReturnValueOnce(['/project/src/App.tsx', '/project/src/Card.tsx'])
      .mockReturnValueOnce(['/project/src/App.tsx'])
    const processor = postcss([pandacss({ cwd: PROJECT_CWD })])

    await processor.process(INPUT, { from: '/project/styles.css' })
    await processor.process(INPUT, { from: '/project/styles.css' })

    expect(driver.applyChanges).toHaveBeenNthCalledWith(1, [
      { path: '/project/src/App.tsx', kind: 'add' },
      { path: '/project/src/Card.tsx', kind: 'add' },
    ])
    expect(driver.applyChanges).toHaveBeenNthCalledWith(2, [
      { path: '/project/src/Card.tsx', kind: 'unlink' },
      { path: '/project/src/App.tsx', kind: 'change' },
    ])
  })

  it('serializes concurrent transforms for the same driver key', async () => {
    const order: string[] = []
    const { createNodeDriver, pandacss } = await setup({
      createDelay: async () => {
        order.push('enter')
        await Promise.resolve()
        order.push('leave')
      },
    })
    const processor = postcss([pandacss({ cwd: PROJECT_CWD })])

    await Promise.all([1, 2, 3, 4].map((index) => processor.process(INPUT, { from: `/project/styles-${index}.css` })))

    expect(createNodeDriver).toHaveBeenCalledTimes(1)
    expect(order).toMatchInlineSnapshot(`
      [
        "enter",
        "leave",
      ]
    `)
  })
})

async function setup(options: { createDelay?: () => Promise<void> } = {}) {
  const driver = createMockDriver()
  const createNodeDriver = vi.fn(async () => {
    await options.createDelay?.()
    return driver
  })

  vi.doMock('@pandacss/compiler', () => ({
    createNodeDriver,
  }))

  const { default: pandacss } = await import('../src/index')

  return {
    createNodeDriver,
    driver,
    pandacss,
    run: (input: string, pluginOptions = {}, from = '/project/styles.css') =>
      postcss([pandacss({ cwd: PROJECT_CWD, ...pluginOptions })]).process(input, { from }),
  }
}

function createMockDriver(): MockDriver {
  return {
    compiler: {
      hasLayerDeclaration: vi.fn((css: string) => css.includes(INPUT)),
      // `sources()` returns `pattern` relative to `base` — a coherent (dir, glob) pair.
      sources: vi.fn(() => [{ base: '/project/src', pattern: '**/*.tsx' }]),
    },
    applyChanges: vi.fn(() => [true]),
    configDependencies: ['panda.config.ts', 'panda.tokens.ts'],
    configPath: '/project/panda.config.ts',
    codegen: vi.fn(() => ['/project/styled-system/css/css.mjs']),
    cssgen: vi.fn(() => ({
      css: '.text_red { color: red }',
      manifest: { files: [], tokens: [] },
      layerRanges: {},
      diagnostics: [],
    })),
    designSystemDiagnostics: [],
    designSystemWatchTargets: vi.fn(() => []),
    getOutdir: vi.fn((outdir?: string) => (outdir ? `/project/${outdir}` : '/project/styled-system')),
    isDesignSystemFile: vi.fn(() => false),
    parseFiles: vi.fn(() => []),
    reload: vi.fn(async () => ({ hasChanged: false, dependencies: [], recipes: [], patterns: [], changes: [] })),
    scan: vi.fn(() => ['/project/src/App.tsx']),
    syncDesignSystemFileChange: vi.fn(async () => false),
  } as unknown as MockDriver
}
