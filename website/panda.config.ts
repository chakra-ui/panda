import { defineConfig } from '@pandacss/dev'

import { tokens } from './theme/tokens'
import { semanticTokens } from './theme/semantic-tokens'
import { recipes } from './theme/recipes'
import { textStyles } from './theme/text-styles'
import { layerStyles } from './theme/layer-styles'
import { globalCss } from './theme/global-css'

export default defineConfig({
  preflight: true,
  // define the content to scan 👇🏻
  include: [
    './src/**/*.{tsx,ts,jsx}',
    './pages/**/*.{jsx,tsx}',
    './app/**/*.{jsx,tsx}',
    './theme.config.tsx'
  ],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  jsxFactory: 'panda',
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
      textStyles,
      layerStyles,
      keyframes: {
        fadein: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadein2: {
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
