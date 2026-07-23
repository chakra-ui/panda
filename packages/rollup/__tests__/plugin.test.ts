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
})

function createDriver(diagnostics: Array<{ severity: 'error' | 'info' | 'warning'; code: string; message: string }>) {
  return {
    compiler: {},
    configPath: undefined,
    codegen: vi.fn(),
    parseFiles: vi.fn(),
    scan: vi.fn(() => []),
    cssgen: vi.fn(() => ({ css: '.generated { color: red }', diagnostics })),
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
