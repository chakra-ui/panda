import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { bundleConfig } from '../src'

const fixture = (name: string) => join(__dirname, 'fixtures', name)

async function loadTheme(dir: string) {
  const { config } = await bundleConfig(join(dir, 'panda.config.ts'), dir)
  return config.theme
}

describe('config imports through tsconfig paths', () => {
  test('resolves an alias when the tsconfig include does not cover the config', async () => {
    expect(await loadTheme(fixture('tsconfig-paths-outside-include'))).toMatchInlineSnapshot(`
      {
        "extend": {
          "tokens": {
            "colors": {
              "brand": {
                "value": "red",
              },
            },
          },
        },
      }
    `)
  })

  test('resolves an alias defined in a referenced project, like Vite tsconfig.app.json', async () => {
    expect(await loadTheme(fixture('tsconfig-paths-in-referenced-project'))).toMatchInlineSnapshot(`
      {
        "extend": {
          "tokens": {
            "colors": {
              "brand": {
                "value": "red",
              },
            },
          },
        },
      }
    `)
  })
})
