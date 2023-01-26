import { describe, expect, test } from 'vitest'
import { getResolvedConfig } from '../src/merge-config'

const config = {
  presets: [
    {
      globalCss: {
        button: {
          background: 'red',
        },
        select: {
          appearance: 'none',
          color: 'white',
        },
      },
    },
  ],

  globalCss: {
    select: {
      background: 'darkred',
    },
    '*': {
      fontFamily: 'Inter',
      margin: '0',
    },

    a: {
      color: 'inherit',
      textDecoration: 'none',
    },
  },
}

const config2 = {
  presets: [
    {
      globalCss: {
        button: {
          background: 'red',
        },
        select: {
          appearance: 'none',
          color: 'white',
        },
      },
    },
  ],

  globalCss: {
    extends: {
      select: {
        background: 'darkred',
      },
      '*': {
        fontFamily: 'Inter',
        margin: '0',
      },

      a: {
        color: 'inherit',
        textDecoration: 'none',
      },
    },
  },
}

describe('getResolvedConfig / globalCSS', () => {
  test.only('should resolve globalCSS in config', async () => {
    const result = await getResolvedConfig(config, '')

    expect(result.globalCss).toMatchInlineSnapshot(`
      {
        "*": {
          "fontFamily": "Inter",
          "margin": "0",
        },
        "a": {
          "color": "inherit",
          "textDecoration": "none",
        },
        "button": {
          "background": "red",
        },
        "select": {
          "background": "darkred",
        },
      }
    `)
  })
})

describe('getResolvedConfig - extend / globalCSS', () => {
  test.only('should resolve and extend globalCSS in config', async () => {
    const result = await getResolvedConfig(config2, '')

    expect(result.globalCss).toMatchInlineSnapshot(`
        {
          "button": {
            "background": "red",
          },
          "extends": {
            "*": {
              "fontFamily": "Inter",
              "margin": "0",
            },
            "a": {
              "color": "inherit",
              "textDecoration": "none",
            },
            "select": {
              "background": "darkred",
            },
          },
          "select": {
            "appearance": "none",
            "color": "white",
          },
        }
      `)
  })
})
