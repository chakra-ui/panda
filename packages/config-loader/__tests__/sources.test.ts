import type { Config, Preset } from '@pandacss/types'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { loadPandaConfig } from '../src/load'
import { resolveAuthoredPresets } from '../src/preset'

const defineConfig = <T extends Config>(config: T) => config
const definePreset = <T extends Preset>(preset: T) => preset

describe('config sources', () => {
  test('omits source metadata by default', async () => {
    const result = await resolveAuthoredPresets(
      defineConfig({
        presets: [definePreset({ name: 'base', conditions: { hover: '&:hover' } })],
      }),
      '/project',
    )

    expect(result.metadata).toBeUndefined()
  })

  test('tracks compact source ids for resolved config paths when requested', async () => {
    const result = await resolveAuthoredPresets(
      defineConfig({
        outdir: 'styled-system',
        presets: [
          definePreset({
            name: 'base',
            conditions: { hover: '&:hover' },
            utilities: {
              color: { className: 'c', values: 'colors' },
            },
            theme: {
              containerNames: ['preset-container'],
              containers: {
                sm: '20rem',
              },
              tokens: {
                colors: {
                  brand: { value: 'preset-brand', description: 'from preset' },
                  black: {
                    value: '#000',
                    extensions: { source: 'preset' },
                  },
                },
              },
              recipes: {
                badge: { className: 'badge', base: { color: 'brand' } },
              },
            },
            staticCss: {
              recipes: { badge: [{ size: ['sm'] }] },
            },
          }),
        ],
        conditions: {
          extend: { active: '&:active' },
        },
        theme: {
          tokens: {
            colors: {
              brand: { value: 'user-brand' },
              black: {
                50: { value: '#fafafa' },
              },
            },
          },
          extend: {
            containerNames: ['user-container'],
            containers: {
              md: '32rem',
            },
            tokens: {
              colors: {
                accent: { value: 'user-accent' },
              },
            },
          },
        },
        staticCss: {
          extend: {
            recipes: { badge: [{ condition: ['md'] }] },
          },
        },
      } as any),
      '/project',
      { trackSources: true, configFile: '/project/panda.config.ts' },
    )

    const sources = result.metadata?.sources

    expect(sources?.entries).toMatchInlineSnapshot(`
      [
        {
          "kind": "preset",
          "name": "base",
        },
        {
          "file": "panda.config.ts",
          "kind": "config",
        },
      ]
    `)
    expect({
      outdir: sources?.paths.outdir,
      hover: sources?.paths['conditions.hover'],
      active: sources?.paths['conditions.active'],
      utility: sources?.paths['utilities.color'],
      utilityField: sources?.paths['utilities.color.className'],
      brand: sources?.paths['theme.tokens.colors.brand'],
      brandValue: sources?.paths['theme.tokens.colors.brand.value'],
      brandDescription: sources?.paths['theme.tokens.colors.brand.description'],
      black: sources?.paths['theme.tokens.colors.black'],
      blackDefaultValue: sources?.paths['theme.tokens.colors.black.DEFAULT.value'],
      blackDefaultExtensions: sources?.paths['theme.tokens.colors.black.DEFAULT.extensions'],
      blackShadeValue: sources?.paths['theme.tokens.colors.black.50.value'],
      accentValue: sources?.paths['theme.tokens.colors.accent.value'],
      recipe: sources?.paths['theme.recipes.badge'],
      containerNames: sources?.paths['theme.containerNames'],
      containerSm: sources?.paths['theme.containers.sm'],
      containerMd: sources?.paths['theme.containers.md'],
      staticRecipe: sources?.paths['staticCss.recipes.badge'],
    }).toMatchInlineSnapshot(`
      {
        "accentValue": 1,
        "active": 1,
        "black": [
          0,
          1,
        ],
        "blackDefaultExtensions": 0,
        "blackDefaultValue": 0,
        "blackShadeValue": 1,
        "brand": [
          0,
          1,
        ],
        "brandDescription": 0,
        "brandValue": 1,
        "containerMd": 1,
        "containerNames": [
          0,
          1,
        ],
        "containerSm": 0,
        "hover": 0,
        "outdir": 1,
        "recipe": 0,
        "staticRecipe": [
          0,
          1,
        ],
        "utility": 0,
        "utilityField": 0,
      }
    `)
  })

  test('loadPandaConfig tracks string preset source entries when requested', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-config-loader-sources-'))
    try {
      writeFileSync(
        join(dir, 'preset.ts'),
        `export default {
          name: 'source-preset',
          conditions: { hover: '&:hover' },
          theme: {
            tokens: { colors: { brand: { value: 'preset-brand' } } },
          },
          staticCss: {
            recipes: { badge: [{ size: ['sm'] }] },
          },
        }`,
      )
      writeFileSync(
        join(dir, 'panda.config.ts'),
        `export default {
          outdir: 'styled-system',
          presets: ['./preset.ts'],
          theme: {
            extend: {
              tokens: { colors: { brand: { value: 'user-brand' } } },
            },
          },
          staticCss: {
            extend: { recipes: { badge: [{ condition: ['md'] }] } },
          },
        }`,
      )

      const result = await loadPandaConfig({ cwd: dir, trackSources: true })

      expect(result.metadata?.sources).toMatchInlineSnapshot(`
        {
          "entries": [
            {
              "file": "preset.ts",
              "kind": "preset",
              "name": "source-preset",
              "specifier": "./preset.ts",
            },
            {
              "file": "panda.config.ts",
              "kind": "config",
            },
          ],
          "paths": {
            "conditions.hover": 0,
            "outdir": 1,
            "staticCss.recipes": [
              0,
              1,
            ],
            "staticCss.recipes.badge": [
              0,
              1,
            ],
            "theme.tokens.colors.brand": [
              0,
              1,
            ],
            "theme.tokens.colors.brand.value": 1,
          },
        }
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
