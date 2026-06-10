import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadCompiler } from '../src/loader'

const CONFIG_SOURCE = `export default {
  outdir: 'styled-system',
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
  patterns: {
    stack: {
      properties: { gap: { type: 'token', value: 'spacing' } },
      defaultValues: { gap: '4' },
      transform(props) {
        return { display: 'flex', flexDirection: 'column', gap: props.gap }
      },
    },
  },
}
`

describe('loadCompiler', () => {
  let dir: string
  let result: Awaited<ReturnType<typeof loadCompiler>>

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'panda-compiler-loader-'))
    writeFileSync(join(dir, 'panda.config.ts'), CONFIG_SOURCE)
    result = await loadCompiler({ cwd: dir }, { crossFile: false })
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('reports the resolved config path and dependencies', () => {
    expect(result.path).toBe(join(dir, 'panda.config.ts'))
    expect(result.dependencies).toContain('panda.config.ts')
  })

  it('embeds the user pattern transform in the generated pattern module', () => {
    const artifact = result.compiler.generateArtifact('patterns')
    const stack = artifact?.files.find((file) => file.path === 'patterns/stack.js')

    expect(stack?.code).toMatchInlineSnapshot(`
      "import { getPatternStyles, patternFns } from './runtime';
      import { css } from '../css/index';

      const stackConfig = {transform(props) {
      	return {
      		display: "flex",
      		flexDirection: "column",
      		gap: props.gap
      	};
      },defaultValues:{gap:'4'}}

      export function stackRaw(styles) {
        const s = getPatternStyles(stackConfig, styles || {})
        return stackConfig.transform(s, patternFns)
      }

      export const stack = /* @__PURE__ */ Object.assign(function stack(styles = {}) {
        return css(stackRaw(styles))
      }, { raw: stackRaw })"
    `)
  })

  it('passes explicit preset tokens, utilities, and recipes through to Rust', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-compiler-loader-preset-'))
    try {
      writeFileSync(
        join(dir, 'preset.ts'),
        `export default {
          name: 'explicit-preset',
          theme: {
            tokens: { colors: { brand: { value: '#123456' } } },
            recipes: {
              badge: {
                className: 'badge',
                base: { color: 'brand' },
                variants: { size: { sm: { fontSize: '12px' } } },
              },
            },
          },
          utilities: {
            brandColor: { className: 'bc', values: 'colors', property: 'color' },
          },
        }`,
      )
      writeFileSync(
        join(dir, 'panda.config.ts'),
        `export default {
          outdir: 'styled-system',
          presets: ['./preset.ts'],
        }`,
      )

      const loaded = await loadCompiler({ cwd: dir }, { crossFile: false })
      const spec = loaded.compiler.spec()

      expect({
        token: spec.tokens.values['colors.brand'],
        utility: spec.utilities.properties.brandColor,
        recipes: loaded.compiler.recipes().map((recipe) => recipe.file),
      }).toMatchInlineSnapshot(`
        {
          "token": "#123456",
          "utility": {
            "name": "brandColor",
            "cssProperty": "color",
            "tokenCategory": "colors",
            "literals": [],
            "primitive": null,
            "alias": "ColorsValue",
          },
          "recipes": [
            "theme.recipes.badge",
          ],
        }
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
