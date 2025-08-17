import type { Config } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { resolveConfig } from '../src/resolve-config'
import type { BundleConfigResult } from '../src/types'

describe('preset:resolved hook', () => {
  const bundleResult: BundleConfigResult = {
    config: {},
    dependencies: [],
    path: '/mock/panda.config.ts',
  }

  test('should be called for each preset', async () => {
    const capturedPresets: Array<{ name: string; colors: Record<string, any> }> = []

    const config: Config = {
      presets: [
        {
          name: 'design-system-preset',
          theme: {
            tokens: {
              colors: {
                primary: { value: '#3b82f6' },
                secondary: { value: '#10b981' },
              },
            },
          },
        },
      ],
      hooks: {
        'preset:resolved': ({ name }: any) => {
          capturedPresets.push(name)
        },
      },
    }

    await resolveConfig({ ...bundleResult, config }, '/mock')

    expect(capturedPresets).toMatchInlineSnapshot(`
      [
        "@pandacss/preset-base",
        "design-system-preset",
      ]
    `)
  })

  test('omit theme', async () => {
    const config: Config = {
      presets: [
        {
          name: 'color-preset',
          theme: {
            tokens: {
              colors: {
                primary: { value: '#3b82f6' },
                secondary: { value: '#10b981' },
                danger: { value: '#ef4444' },
                warning: { value: '#f59e0b' },
                success: { value: '#22c55e' },
              },
            },
          },
        },
      ],
      hooks: {
        'preset:resolved': ({ preset, utils }: any) => {
          return utils.omit(preset, ['theme.tokens.colors.danger', 'theme.tokens.colors.warning'])
        },
      },
    }

    const result = await resolveConfig({ ...bundleResult, config }, '/mock')

    expect(result.config.theme).toMatchInlineSnapshot(`
      {
        "tokens": {
          "colors": {
            "primary": {
              "value": "#3b82f6",
            },
            "secondary": {
              "value": "#10b981",
            },
            "success": {
              "value": "#22c55e",
            },
          },
        },
      }
    `)
  })

  test('pick theme', async () => {
    const config: Config = {
      presets: [
        {
          name: 'brand-preset',
          theme: {
            tokens: {
              colors: {
                primary: { value: '#3b82f6' },
                secondary: { value: '#10b981' },
                accent: { value: '#8b5cf6' },
                muted: { value: '#6b7280' },
                background: { value: '#ffffff' },
              },
            },
          },
        },
      ],
      hooks: {
        'preset:resolved': ({ preset, utils }: any) => {
          return utils.pick(preset, ['name', 'theme.tokens.colors.primary', 'theme.tokens.colors.secondary'])
        },
      },
    }

    const result = await resolveConfig({ ...bundleResult, config }, '/mock')

    // Verify only the picked colors are present
    expect(result.config.theme).toMatchInlineSnapshot(`
      {
        "tokens": {
          "colors": {
            "primary": {
              "value": "#3b82f6",
            },
            "secondary": {
              "value": "#10b981",
            },
          },
        },
      }
    `)
  })
})
