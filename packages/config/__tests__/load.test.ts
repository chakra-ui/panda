import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { loadConfig } from '../src/load'
import type { LoadConfigResult } from '../src/types'

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
  const dir = mkdtempSync(join(tmpdir(), 'panda-config-'))
  for (const [file, source] of Object.entries(files)) {
    writeFileSync(join(dir, file), source)
  }
  const result = await loadConfig({ cwd: dir })
  return { dir, result }
}

function hasOwnKey(value: unknown, key: string): boolean {
  if (!value || typeof value !== 'object') return false
  if (Object.prototype.hasOwnProperty.call(value, key)) return true
  return Object.values(value).some((child) => hasOwnKey(child, key))
}

async function expectLoadError(files: Record<string, string>, expected: RegExp) {
  const dir = mkdtempSync(join(tmpdir(), 'panda-config-error-'))
  try {
    for (const [file, source] of Object.entries(files)) {
      writeFileSync(join(dir, file), source)
    }
    await expect(loadConfig({ cwd: dir })).rejects.toThrow(expected)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('loadConfig', () => {
  let dir: string
  let result: LoadConfigResult

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'panda-config-'))
    writeFileSync(join(dir, 'panda.config.ts'), CONFIG_SOURCE)
    result = await loadConfig({ cwd: dir })
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

describe('loadConfig preset resolution', () => {
  test('runs config:resolved after presets are merged', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `export default {
        outdir: 'styled-system',
        plugins: [{
          name: 'config-rewriter',
          hooks: {
            'config:resolved'({ config, path, dependencies, utils }) {
              const next = utils.omit(config, ['patterns.stack'])
              next.theme = {
                tokens: {
                  colors: {
                    seenPath: { value: path.endsWith('panda.config.ts') ? '#0f0' : '#f00' },
                    seenDeps: { value: dependencies.includes('panda.config.ts') ? '#0f0' : '#f00' },
                    fromPreset: config.theme.tokens.colors.fromPreset,
                  },
                },
              }
              return next
            },
          },
        }],
        presets: [{
          name: 'brand',
          theme: { tokens: { colors: { fromPreset: { value: '#123' } } } },
        }],
        patterns: {
          stack: {
            properties: { gap: {} },
            transform: (props) => ({ display: 'flex', gap: props.gap }),
          },
        },
      }`,
    })

    try {
      const patterns = result.config.patterns as Record<string, unknown> | undefined
      const colors = ((result.config.theme as { tokens?: { colors?: unknown } } | undefined)?.tokens?.colors ??
        {}) as Record<string, unknown>

      expect(patterns?.stack).toBeUndefined()
      expect(colors).toMatchObject({
        seenPath: { value: '#0f0' },
        seenDeps: { value: '#0f0' },
        fromPreset: { value: '#123' },
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('runs preset:resolved hooks before merging a preset', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `export default {
        outdir: 'styled-system',
        plugins: [{
          name: 'preset-rewriter',
          hooks: {
            'preset:resolved'({ preset, name }) {
              return {
                ...preset,
                theme: {
                  extend: {
                    tokens: {
                      colors: {
                        [name]: { value: '#0f0' },
                      },
                    },
                  },
                },
              }
            },
          },
        }],
        presets: [{ name: 'brand' }],
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.colors.brand).toEqual({ value: '#0f0' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

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

  test('loads configs that use local dynamic imports', () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-config-'))
    writeFileSync(
      join(dir, 'preset.ts'),
      `export default {
        name: 'dynamic-preset',
        theme: { tokens: { colors: { dynamic: { value: '#0f0' } } } },
      }`,
    )
    writeFileSync(
      join(dir, 'panda.config.ts'),
      `export default (async () => {
        const mod = await import('./preset')
        return {
          outdir: 'styled-system',
          presets: [mod.default],
        }
      })()`,
    )

    try {
      const loadPath = process.cwd().endsWith(join('packages', 'config'))
        ? join(process.cwd(), 'src/load.ts')
        : join(process.cwd(), 'packages/config/src/load.ts')
      const loadUrl = pathToFileURL(loadPath).href
      const script = `
        import { loadConfig } from ${JSON.stringify(loadUrl)}

        const result = await loadConfig({ cwd: ${JSON.stringify(dir)} })
        const value = result.config.theme?.tokens?.colors?.dynamic?.value
        if (value !== '#0f0') throw new Error('Expected dynamic preset token to load')
        if (!result.dependencies.includes('preset.ts')) throw new Error('Expected preset.ts dependency')
        console.log(value)
      `
      const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
        cwd: process.cwd(),
        encoding: 'utf8',
      })
      expect(output.trim()).toBe('#0f0')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('loads bundled deps that create a require from import.meta.url', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-config-require-'))
    const packageDir = join(dir, 'node_modules', 'import-meta-require')

    try {
      mkdirSync(packageDir, { recursive: true })
      writeFileSync(
        join(packageDir, 'package.json'),
        JSON.stringify({ name: 'import-meta-require', type: 'module', exports: './index.js' }),
      )
      writeFileSync(
        join(packageDir, 'index.js'),
        `import { createRequire } from 'node:module'
        const require = createRequire(import.meta.url)
        export const token = require('./token.cjs')`,
      )
      writeFileSync(join(packageDir, 'token.cjs'), `module.exports = '#0f0'`)
      writeFileSync(
        join(dir, 'panda.config.ts'),
        `import { token } from 'import-meta-require'
        export default {
          outdir: 'styled-system',
          theme: { tokens: { colors: { importMeta: { value: token } } } },
        }`,
      )

      const result = await loadConfig({ cwd: dir })
      expect((result.config.theme as any).tokens.colors.importMeta).toEqual({ value: '#0f0' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('resolves import.meta.url relative to bundled dependency modules', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-config-dep-url-'))
    const packageDir = join(dir, 'node_modules', 'import-meta-url-dep')

    try {
      mkdirSync(packageDir, { recursive: true })
      writeFileSync(
        join(packageDir, 'package.json'),
        JSON.stringify({ name: 'import-meta-url-dep', type: 'module', exports: './index.js' }),
      )
      writeFileSync(join(packageDir, 'token.json'), JSON.stringify({ value: '#0f0' }))
      writeFileSync(
        join(packageDir, 'index.js'),
        `import { readFileSync } from 'node:fs'
        export const token = JSON.parse(readFileSync(new URL('./token.json', import.meta.url), 'utf8')).value`,
      )
      writeFileSync(
        join(dir, 'panda.config.ts'),
        `import { token } from 'import-meta-url-dep'
        export default {
          outdir: 'styled-system',
          theme: { tokens: { colors: { dependencyUrl: { value: token } } } },
        }`,
      )

      const result = await loadConfig({ cwd: dir })
      expect((result.config.theme as any).tokens.colors.dependencyUrl).toEqual({ value: '#0f0' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('does not rewrite import.meta.url inside string literals', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `export default {
        outdir: 'styled-system',
        theme: { tokens: { colors: { literal: { value: 'import.meta.url' } } } },
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.colors.literal).toEqual({ value: 'import.meta.url' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('rewrites import.meta.url inside template expressions', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `const url = \`\${import.meta.url}\`
      export default {
        outdir: 'styled-system',
        theme: { tokens: { colors: { template: { value: url.includes('panda.config.ts') ? '#0f0' : '#f00' } } } },
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.colors.template).toEqual({ value: '#0f0' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('rewrites multiple import.meta.url occurrences in one module', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `const first = import.meta.url.includes('panda.config.ts')
      const second = new URL('./panda.config.ts', import.meta.url).href.includes('panda.config.ts')
      export default {
        outdir: 'styled-system',
        theme: { tokens: { colors: { multiple: { value: first && second ? '#0f0' : '#f00' } } } },
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.colors.multiple).toEqual({ value: '#0f0' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('does not rewrite import.meta.url inside regex literals', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `const literal = /import\\.meta\\.url/.test('import.meta.url')
      export default {
        outdir: 'styled-system',
        theme: { tokens: { colors: { regex: { value: literal ? '#0f0' : '#f00' } } } },
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.colors.regex).toEqual({ value: '#0f0' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('does not rewrite import.meta.url inside comments', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `// import.meta.url
      /* import.meta.url */
      export default {
        outdir: 'styled-system',
        theme: { tokens: { colors: { comments: { value: '#0f0' } } } },
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.colors.comments).toEqual({ value: '#0f0' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('leaves computed import.meta access untouched', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `const value = import.meta['url'].startsWith('data:') ? '#0f0' : '#f00'
      export default {
        outdir: 'styled-system',
        theme: { tokens: { colors: { computed: { value } } } },
      }`,
    })

    try {
      expect((result.config.theme as any).tokens.colors.computed).toEqual({ value: '#0f0' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('resolves import.meta.url relative to the config file location', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-config-meta-url-'))

    try {
      mkdirSync(join(dir, 'config'), { recursive: true })
      writeFileSync(join(dir, 'config', 'token.json'), JSON.stringify({ value: '#123' }))
      writeFileSync(
        join(dir, 'config', 'panda.config.ts'),
        `import { readFileSync } from 'node:fs'
        const token = JSON.parse(readFileSync(new URL('./token.json', import.meta.url), 'utf8')).value
        export default {
          outdir: 'styled-system',
          theme: { tokens: { colors: { nested: { value: token } } } },
        }`,
      )

      const result = await loadConfig({ cwd: dir, file: 'config/panda.config.ts' })
      expect((result.config.theme as any).tokens.colors.nested).toEqual({ value: '#123' })
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

  test('serializes plugins into ordered parser:before hooks', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `const sfc = {
        name: 'sfc',
        hooks: {
          'parser:before': {
            filter: { id: { include: ['**/*.vue'] }, code: { include: /css\\(/ } },
            handler({ content }) {
              return content.replace('__COLOR__', "'red'")
            },
          },
        },
      }

      export default {
        outdir: 'styled-system',
        plugins: [
          sfc,
          {
            name: 'local',
            hooks: {
              'parser:before'({ content }) {
                return content.replace('__BG__', "'blue'")
              },
            },
          },
        ],
      }`,
    })

    try {
      expect(result.hooks?.['parser:before']).toMatchObject([
        {
          id: 'plugins.0.hooks.parser:before.0',
          name: 'sfc',
          filter: {
            id: { include: ['**/*.vue'] },
            code: { include: { kind: 'regex', source: 'css\\(', flags: '' } },
          },
        },
        {
          id: 'plugins.1.hooks.parser:before.1',
          name: 'local',
        },
      ])
      expect(result.hooks?.['parser:before']?.map((hook) => hook.hash)).toEqual([
        expect.stringMatching(/^fn1-/),
        expect.stringMatching(/^fn1-/),
      ])
      expect(Object.keys(result.callbacks['parser:before'] ?? {})).toEqual([
        'plugins.0.hooks.parser:before.0',
        'plugins.1.hooks.parser:before.1',
      ])
      expect((result.config as any).plugins).toBeUndefined()
      expect((result.config as any).hooks).toBeUndefined()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('appends extend.plugins after base plugins', async () => {
    const { dir, result } = await loadTempConfig({
      'panda.config.ts': `export default {
        outdir: 'styled-system',
        plugins: [
          { name: 'base', hooks: { 'parser:before': ({ content }) => content } },
        ],
        extend: {
          plugins: [
            { name: 'extra', hooks: { 'parser:before': ({ content }) => content } },
          ],
        },
      }`,
    })

    try {
      expect(result.hooks?.['parser:before']?.map((hook) => hook.name)).toEqual(['base', 'extra'])
      expect(Object.keys(result.callbacks['parser:before'] ?? {})).toEqual([
        'plugins.0.hooks.parser:before.0',
        'plugins.1.hooks.parser:before.1',
      ])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('loadConfig errors', () => {
  test('rejects removed root hooks with a migration hint', async () => {
    await expectLoadError(
      {
        'panda.config.ts': `export default {
          outdir: 'styled-system',
          hooks: {
            'parser:before': ({ content }) => content,
          },
        }`,
      },
      /`config\.hooks` was removed in v2/,
    )
  })

  test('rejects plugins without a name', async () => {
    await expectLoadError(
      {
        'panda.config.ts': `export default {
          outdir: 'styled-system',
          plugins: [{ hooks: { 'parser:before': ({ content }) => content } }],
        }`,
      },
      /Every plugin in `config\.plugins` must be an object with a non-empty `name`/,
    )
  })

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

describe('loadConfig cwd isolation', () => {
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

    const first = await loadConfig({ cwd: a })
    const second = await loadConfig({ cwd: b })

    expect(first.config.cwd).toBe(a)
    expect(second.config.cwd).toBe(b)
  })
})
