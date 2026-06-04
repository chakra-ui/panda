import postcss from 'postcss'
import { afterEach, describe, expect, it, vi } from 'vitest'

const PROJECT_CWD = '/project'
const INPUT = '@layer reset, base, tokens, recipes, utilities;'

interface MockDriver {
  compiler: {
    hasLayerDeclaration: ReturnType<typeof vi.fn>
    sources: ReturnType<typeof vi.fn>
  }
  configDependencies: string[]
  configPath: string
  codegen: ReturnType<typeof vi.fn>
  cssgen: ReturnType<typeof vi.fn>
  getOutdir: ReturnType<typeof vi.fn>
  parseFiles: ReturnType<typeof vi.fn>
  reload: ReturnType<typeof vi.fn>
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('@pandacss/postcss_v2', () => {
  it('skips node_modules CSS files by default', async () => {
    const { createNodeDriver, run } = await setup()

    const result = await run(INPUT, {}, '/project/node_modules/pkg/styles.css')

    expect(result.css).toBe(INPUT)
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

    expect(result.css).toBe(INPUT)
    expect(createNodeDriver).not.toHaveBeenCalled()
  })

  it('skips stylesheets without any layer at-rule before loading the driver', async () => {
    const { createNodeDriver, run } = await setup()
    const input = '.btn { color: red }'

    const result = await run(input)

    expect(result.css).toBe(input)
    expect(createNodeDriver).not.toHaveBeenCalled()
  })

  it('uses the compiler layer check before injecting generated CSS', async () => {
    const { driver, run } = await setup()
    driver.compiler.hasLayerDeclaration.mockReturnValue(false)

    const result = await run('@layer base { .btn { color: red } }')

    expect(result.css).toBe('@layer base { .btn { color: red } }')
    expect(driver.codegen).not.toHaveBeenCalled()
    expect(driver.parseFiles).not.toHaveBeenCalled()
  })

  it('processes the stylesheet root and registers watch dependencies', async () => {
    const { driver, run } = await setup()

    const result = await run(INPUT)

    expect(driver.codegen).toHaveBeenCalledWith({ cwd: PROJECT_CWD, outdir: undefined })
    expect(driver.parseFiles).toHaveBeenCalledTimes(1)
    expect(driver.cssgen).toHaveBeenCalledWith({ emitLayerDeclaration: false })
    expect(result.css).toContain('.text_red')
    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'dir-dependency',
          dir: '/project/src',
          glob: 'src/**/*.tsx',
          plugin: 'pandacss',
          parent: '/project/styles.css',
        }),
        expect.objectContaining({
          type: 'dependency',
          file: '/project/panda.config.ts',
          plugin: 'pandacss',
          parent: '/project/styles.css',
        }),
        expect.objectContaining({
          type: 'dependency',
          file: '/project/panda.tokens.ts',
          plugin: 'pandacss',
          parent: '/project/styles.css',
        }),
      ]),
    )
  })

  it('uses dependency messages for source directories in Rollup watch mode', async () => {
    vi.stubEnv('ROLLUP_WATCH', 'true')
    const { run } = await setup()

    const result = await run(INPUT)

    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'dependency',
          file: '/project/src',
          plugin: 'pandacss',
        }),
      ]),
    )
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
    expect(order).toEqual(['enter', 'leave'])
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
      sources: vi.fn(() => [{ base: '/project/src', pattern: 'src/**/*.tsx' }]),
    },
    configDependencies: ['panda.config.ts', 'panda.tokens.ts'],
    configPath: '/project/panda.config.ts',
    codegen: vi.fn(() => ['/project/styled-system/css/css.mjs']),
    cssgen: vi.fn(() => ({
      css: '.text_red { color: red }',
      manifest: { files: [], tokens: [] },
      layerRanges: {},
      diagnostics: [],
    })),
    getOutdir: vi.fn((outdir?: string) => (outdir ? `/project/${outdir}` : '/project/styled-system')),
    parseFiles: vi.fn(() => []),
    reload: vi.fn(async () => ({ hasChanged: false, dependencies: [], recipes: [], patterns: [], changes: [] })),
  } as unknown as MockDriver
}
