import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { loadPandaConfig } from '../src/load'
import type { LoadedPandaConfig } from '../src/types'

const CONFIG_SOURCE = `export default {
  outdir: 'styled-system',
  patterns: {
    stack: {
      properties: { gap: { type: 'token', value: 'spacing' } },
      defaultValues: { gap: '4' },
      transform(props) {
        return { display: 'flex', flexDirection: 'column', gap: props.gap }
      },
    },
  },
  utilities: {
    size: {
      transform(value) {
        return { width: value, height: value }
      },
    },
  },
}
`

async function loadTempConfig(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'panda-config-loader-'))
  for (const [file, source] of Object.entries(files)) {
    writeFileSync(join(dir, file), source)
  }
  const result = await loadPandaConfig({ cwd: dir })
  return { dir, result }
}

function hasOwnKey(value: unknown, key: string): boolean {
  if (!value || typeof value !== 'object') return false
  if (Object.prototype.hasOwnProperty.call(value, key)) return true
  return Object.values(value).some((child) => hasOwnKey(child, key))
}

async function expectLoadError(files: Record<string, string>, expected: RegExp) {
  const dir = mkdtempSync(join(tmpdir(), 'panda-config-loader-error-'))
  try {
    for (const [file, source] of Object.entries(files)) {
      writeFileSync(join(dir, file), source)
    }
    await expect(loadPandaConfig({ cwd: dir })).rejects.toThrow(expected)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('loadPandaConfig', () => {
  let dir: string
  let result: LoadedPandaConfig

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'panda-config-loader-'))
    writeFileSync(join(dir, 'panda.config.ts'), CONFIG_SOURCE)
    result = await loadPandaConfig({ cwd: dir })
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  test('discovers the config file', () => {
    expect(result.path).toBe(join(dir, 'panda.config.ts'))
  })

  test('lowers the pattern to a callback ref + codegenSource', () => {
    expect(result.config.patterns).toMatchInlineSnapshot(`
      {
        "stack": {
          "codegenSource": "{transform(props) {
      	return {
      		display: "flex",
      		flexDirection: "column",
      		gap: props.gap
      	};
      },defaultValues:{gap:'4'}}",
          "defaultValues": {
            "gap": "4",
          },
          "properties": {
            "gap": {
              "type": "token",
              "value": "spacing",
            },
          },
          "transform": {
            "hash": "fn1-1ydydk6",
            "id": "patterns.stack.transform",
            "kind": "js-callback",
          },
        },
      }
    `)
  })

  test('lowers the utility transform to a callback ref', () => {
    expect(result.config.utilities).toMatchInlineSnapshot(`
      {
        "size": {
          "transform": {
            "hash": "fn1-25sv67",
            "id": "utilities.size.transform",
            "kind": "js-callback",
          },
        },
      }
    `)
  })

  test('collects the live transform functions, keyed by ref id', () => {
    const callbackIds = Object.fromEntries(
      Object.entries(result.callbacks).map(([kind, fns]) => [kind, Object.keys(fns ?? {})]),
    )
    expect(callbackIds).toMatchInlineSnapshot(`
      {
        "pattern.transform": [
          "patterns.stack.transform",
        ],
        "utility.transform": [
          "utilities.size.transform",
        ],
      }
    `)

    const patternTransform = result.callbacks['pattern.transform']?.['patterns.stack.transform'] as any
    const utilityTransform = result.callbacks['utility.transform']?.['utilities.size.transform'] as any
    expect(patternTransform({ gap: '6' })).toMatchInlineSnapshot(`
      {
        "display": "flex",
        "flexDirection": "column",
        "gap": "6",
      }
    `)
    expect(utilityTransform('40px')).toMatchInlineSnapshot(`
      {
        "height": "40px",
        "width": "40px",
      }
    `)
  })

  test('re-evaluating codegenSource yields the original transform behavior', () => {
    const source = (result.config.patterns as any).stack.codegenSource as string
    const evaluated = new Function(`return (${source})`)() as { transform: Function; defaultValues: any }
    expect(evaluated.transform({ gap: '8' })).toMatchInlineSnapshot(`
      {
        "display": "flex",
        "flexDirection": "column",
        "gap": "8",
      }
    `)
    expect(evaluated.defaultValues).toMatchInlineSnapshot(`
      {
        "gap": "4",
      }
    `)
  })

  test('reports the config file as a dependency', () => {
    expect(result.dependencies).toMatchInlineSnapshot(`
      [
        "panda.config.ts",
      ]
    `)
  })
})

describe('loadPandaConfig preset resolution', () => {
  test('resolves object presets with theme.extend and keeps user config precedence', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `export default {
        outdir: 'styled-system',
        presets: [{
          name: 'object-preset',
          theme: {
            tokens: { colors: { base: { value: '#111' } } },
            extend: {
              tokens: {
                colors: {
                  preset: { value: '#222' },
                  shared: { value: 'from-preset' },
                },
              },
            },
          },
        }],
        theme: {
          extend: {
            tokens: {
              colors: {
                shared: { value: 'from-user' },
                user: { value: '#333' },
              },
            },
          },
        },
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.colors).toMatchInlineSnapshot(`
        {
          "base": {
            "value": "#111",
          },
          "preset": {
            "value": "#222",
          },
          "shared": {
            "value": "from-user",
          },
          "user": {
            "value": "#333",
          },
        }
      `)
      expect(hasOwnKey(result.config, 'extend')).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('keeps user base values above preset extend while merging user extend into preset base', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `export default {
        outdir: 'styled-system',
        presets: [{
          name: 'object-preset',
          theme: {
            extend: {
              tokens: {
                colors: {
                  brand: { value: 'from-preset-extend' },
                },
              },
            },
          },
          staticCss: {
            recipes: {
              badge: [{ size: ['sm'] }],
            },
          },
        }],
        theme: {
          tokens: {
            colors: {
              brand: { value: 'from-user-base' },
            },
          },
        },
        staticCss: {
          extend: {
            recipes: {
              badge: [{ variants: ['*'] }],
            },
          },
        },
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.colors.brand).toEqual({ value: 'from-user-base' })
      expect((result.config.staticCss as any).recipes.badge).toMatchInlineSnapshot(`
        [
          {
            "size": [
              "sm",
            ],
          },
          {
            "variants": [
              "*",
            ],
          },
        ]
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('resolves nested presets depth-first', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `export default {
        outdir: 'styled-system',
        presets: [{
          name: 'outer-preset',
          presets: [{
            name: 'inner-preset',
            theme: { extend: { tokens: { spacing: { 1: { value: '4px' } } } } },
          }],
          theme: { extend: { tokens: { spacing: { 2: { value: '8px' } } } } },
        }],
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.spacing).toMatchInlineSnapshot(`
        {
          "1": {
            "value": "4px",
          },
          "2": {
            "value": "8px",
          },
        }
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('resolves async object presets', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `const asyncPreset = Promise.resolve({
        name: 'async-preset',
        theme: { extend: { tokens: { sizes: { sm: { value: '24px' } } } } },
      })

      export default {
        outdir: 'styled-system',
        presets: [asyncPreset],
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.sizes.sm).toEqual({ value: '24px' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('resolves string module presets and tracks their dependencies', async () => {
    const { dir, result } = await loadTempConfig({
      'preset-token.ts': `export const presetColor = '#0f0'`,
      'preset.ts': `import { presetColor } from './preset-token'

        export default {
          name: 'string-preset',
          theme: { extend: { tokens: { colors: { string: { value: presetColor } } } } },
          utilities: {
            extend: {
              stringColor: { className: 'sc', values: 'colors', property: 'color' },
            },
          },
        }`,
      'panda.config.ts': `export default {
        outdir: 'styled-system',
        dependencies: ['manual.txt', 'preset.ts'],
        presets: ['./preset.ts'],
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.colors.string).toEqual({ value: '#0f0' })
      expect((result.config.utilities as any).stringColor).toEqual({
        className: 'sc',
        values: 'colors',
        property: 'color',
      })
      expect(result.dependencies).toEqual(
        expect.arrayContaining(['panda.config.ts', 'preset.ts', 'preset-token.ts', 'manual.txt']),
      )
      expect(new Set(result.dependencies).size).toBe(result.dependencies.length)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('does not add automatic presets when presets is omitted', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `export default { outdir: 'styled-system' }`,
    })

    try {
      expect(result.config.theme).toBeUndefined()
      expect(result.config.utilities).toBeUndefined()
      expect((result.config as any).presets).toBeUndefined()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('does not add automatic presets when presets is empty', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `export default { outdir: 'styled-system', presets: [] }`,
    })

    try {
      expect(result.config.theme).toBeUndefined()
      expect(result.config.utilities).toBeUndefined()
      expect((result.config as any).presets).toBeUndefined()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('serializes preset functions to callbacks and pattern codegenSource', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `export default {
        outdir: 'styled-system',
        presets: [{
          name: 'function-preset',
          patterns: {
            stack: {
              properties: { gap: {} },
              defaultValues() {
                return { gap: '2' }
              },
              transform(props) {
                return { display: 'grid', gap: props.gap }
              },
            },
          },
          utilities: {
            size: {
              transform(value) {
                return { width: value, height: value }
              },
            },
          },
        }],
      }`,
    })

    try {
      expect(Object.fromEntries(Object.entries(result.callbacks).map(([kind, fns]) => [kind, Object.keys(fns ?? {})])))
        .toMatchInlineSnapshot(`
        {
          "pattern.defaultValues": [
            "patterns.stack.defaultValues",
          ],
          "pattern.transform": [
            "patterns.stack.transform",
          ],
          "utility.transform": [
            "utilities.size.transform",
          ],
        }
      `)

      const patternTransform = result.callbacks['pattern.transform']?.['patterns.stack.transform'] as any
      const utilityTransform = result.callbacks['utility.transform']?.['utilities.size.transform'] as any

      expect((result.config.patterns as any).stack.codegenSource).toContain('display: "grid"')
      expect(patternTransform({ gap: '4' }, {})).toEqual({
        display: 'grid',
        gap: '4',
      })
      expect(utilityTransform('20px', {})).toEqual({
        width: '20px',
        height: '20px',
      })
      expect((result.config as any).presets).toBeUndefined()
      expect(hasOwnKey(result.config, 'extend')).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('loadPandaConfig errors', () => {
  test('rejects invalid root config exports', async () => {
    await expectLoadError(
      {
        'panda.config.ts': `export default null`,
      },
      /Config must export or return an object/,
    )
  })

  test('rejects object presets that resolve to non-objects', async () => {
    await expectLoadError(
      {
        'panda.config.ts': `export default { outdir: 'styled-system', presets: [42] }`,
      },
      /Preset "unknown-preset" must resolve to an object/,
    )
  })

  test('rejects async presets that resolve to non-objects', async () => {
    await expectLoadError(
      {
        'panda.config.ts': `export default {
          outdir: 'styled-system',
          presets: [Promise.resolve(null)],
        }`,
      },
      /Preset "unknown-preset" must resolve to an object/,
    )
  })

  test('wraps rejected async presets in config errors', async () => {
    await expectLoadError(
      {
        'panda.config.ts': `export default {
          outdir: 'styled-system',
          presets: [Promise.reject(new Error('boom'))],
        }`,
      },
      /Failed to resolve preset "unknown-preset": boom/,
    )
  })

  test('rejects string presets that export non-objects', async () => {
    await expectLoadError(
      {
        'bad-preset.ts': `export default []`,
        'panda.config.ts': `export default { outdir: 'styled-system', presets: ['./bad-preset.ts'] }`,
      },
      /Preset "\.\/bad-preset\.ts" must resolve to an object/,
    )
  })

  test('reports unresolvable string preset modules', async () => {
    await expectLoadError(
      {
        'panda.config.ts': `export default { outdir: 'styled-system', presets: ['./missing-preset.ts'] }`,
      },
      /Failed to resolve preset "\.\/missing-preset\.ts"/,
    )
  })

  test('rejects circular object preset graphs', async () => {
    await expectLoadError(
      {
        'panda.config.ts': `const preset = { name: 'cycle-preset' }
        preset.presets = [preset]
        export default { outdir: 'styled-system', presets: [preset] }`,
      },
      /Circular preset dependency detected/,
    )
  })

  test('rejects non-object extend values while resolving presets', async () => {
    await expectLoadError(
      {
        'panda.config.ts': `export default {
          outdir: 'styled-system',
          presets: [{ name: 'bad-extend', theme: { extend: [] } }],
        }`,
      },
      /Config section `theme\.extend` must be an object/,
    )
  })
})

describe('loadPandaConfig cwd isolation', () => {
  // Two projects with byte-identical config content bundle to identical code,
  // so the in-memory `data:`-URL import resolves to the same cached ESM module.
  // The loader must still resolve each call's own `cwd` (no mutation leak).
  const SHARED_SOURCE = `export default { outdir: 'styled-system' }\n`
  const dirs: string[] = []

  afterAll(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
  })

  test('resolves each load against its own cwd', async () => {
    const a = mkdtempSync(join(tmpdir(), 'panda-config-a-'))
    const b = mkdtempSync(join(tmpdir(), 'panda-config-b-'))
    dirs.push(a, b)
    writeFileSync(join(a, 'panda.config.ts'), SHARED_SOURCE)
    writeFileSync(join(b, 'panda.config.ts'), SHARED_SOURCE)

    const first = await loadPandaConfig({ cwd: a })
    const second = await loadPandaConfig({ cwd: b })

    expect(first.config.cwd).toBe(a)
    expect(second.config.cwd).toBe(b)
  })
})
