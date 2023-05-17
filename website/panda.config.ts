import { defineConfig } from '@pandacss/dev'

import { tokens } from './theme/theme.tokens'
import { semanticTokens } from './theme/theme.semantic-tokens'
import { recipes } from './theme/theme.recipes'
import { globalCss } from './theme/theme.global-css'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets'],
  // define the content to scan 👇🏻
  include: [
    './src/**/*.{tsx,jsx}',
    './pages/**/*.{jsx,tsx}',
    './app/**/*.{jsx,tsx}',
    './theme.config.tsx'
  ],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  utilities: {
    extend: {
      transitionProperty: {
        transform(value) {
          return {
            transitionProperty: value,
            transitionDuration: '.15s',
            transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)'
          }
        }
      }
    }
  },
  conditions: {
    extend: {
      dark: '.dark &, [data-theme="dark"] &',
      light: '.light &',
      supportsBackdrop:
        '@supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))'
    }
  },
  staticCss: {
    recipes: {
      // used in .mdx files, e.g. <Callout type="default" /> or with the blockquote sign like: `> Blabla`
      // ts-morph can't parse MDX properly, so we need to specify it here
      callout: [{ type: ['*'] }],
      card: [{ variant: ['*'] }]
    }
  },
  theme: {
    extend: {
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      },
      semanticTokens,
      tokens,
      recipes,
      keyframes: {
        fadein: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeout: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        }
      }
    }
  },
  globalCss
})
