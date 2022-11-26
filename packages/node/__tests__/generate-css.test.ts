import type { LoadConfigResult } from '@pandacss/config'
import { breakpoints, conditions, keyframes, semanticTokens, tokens } from '@pandacss/fixture'
import { expect, test } from 'vitest'
import { createContext } from '../src/context'
import { generateTokenCss } from '../src/generators/token-css'

const conf: LoadConfigResult = {
  dependencies: [],
  config: {
    cwd: '',
    include: [],
    tokens,
    semanticTokens,
    breakpoints,
    conditions,
    keyframes,
    outdir: '',
  },
  path: '',
}

test('[css] should generate css', () => {
  const ctx = createContext(conf)
  const css = generateTokenCss(ctx, ':root')

  expect(css).toMatchInlineSnapshot(`
    "@layer tokens {
      :root {
        --fonts-heading: -apple-system, BlinkMacSystemFont;
        --fonts-body: Helvetica, Arial, sans-serif;
        --fonts-mono: SFMono-Regular, Menlo, Monaco;
        --colors-current: currentColor;
        --colors-gray-50: #FAFAFA;
        --colors-gray-100: #F5F5F5;
        --colors-gray-200: #E5E5E5;
        --colors-gray-300: #D4D4D4;
        --colors-gray-400: #A3A3A3;
        --colors-gray-500: #737373;
        --colors-gray-600: #525252;
        --colors-gray-700: #333333;
        --colors-gray-800: #121212;
        --colors-gray-900: #0A0A0A;
        --colors-green-50: #F0FFF4;
        --colors-green-100: #C6F6D5;
        --colors-green-200: #9AE6B4;
        --colors-green-300: #68D391;
        --colors-green-400: #48BB78;
        --colors-green-500: #38A169;
        --colors-green-600: #2F855A;
        --colors-green-700: #276749;
        --colors-green-800: #22543D;
        --colors-green-900: #1C4532;
        --colors-red-50: #FEF2F2;
        --colors-red-100: #FEE2E2;
        --colors-red-200: #FECACA;
        --colors-red-300: #FCA5A5;
        --colors-red-400: #F87171;
        --colors-red-500: #EF4444;
        --colors-red-600: #DC2626;
        --colors-red-700: #B91C1C;
        --colors-red-800: #991B1B;
        --colors-red-900: #7F1D1D;
        --font-sizes-sm: 0.5rem;
        --font-sizes-xs: 0.75rem;
        --font-sizes-md: 0.875rem;
        --font-sizes-lg: 1.125rem;
        --font-sizes-xl: 1.25rem;
        --line-heights-normal: normal;
        --line-heights-none: 1;
        --line-heights-shorter: 1.25;
        --line-heights-short: 1.375;
        --line-heights-base: 1.5;
        --line-heights-tall: 1.625;
        --line-heights-taller: 2;
        --font-weights-normal: 400;
        --font-weights-medium: 500;
        --font-weights-semibold: 600;
        --font-weights-bold: 700;
        --letter-spacings-tighter: -0.05em;
        --letter-spacings-tight: -0.025em;
        --letter-spacings-normal: 0;
        --letter-spacings-wide: 0.025em;
        --letter-spacings-wider: 0.05em;
        --letter-spacings-widest: 0.1em;
        --radii-none: 0;
        --radii-sm: 0.125rem;
        --radii-base: 0.25rem;
        --radii-md: 0.375rem;
        --radii-lg: 0.5rem;
        --radii-xl: 0.75rem;
        --radii-2xl: 1rem;
        --radii-3xl: 1.5rem;
        --radii-full: 9999px;
        --shadows-xs: 0 0 0 1px rgba(0, 0, 0, 0.05);
        --shadows-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadows-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        --shadows-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --spacing-1: 0.25rem;
        --spacing-2: 0.5rem;
        --spacing-3: 0.75rem;
        --spacing-4: 1rem;
        --spacing-5: 1.25rem;
        --spacing-6: 1.5rem;
        --spacing-0\\\\.5: 0.125rem;
        --spacing-1\\\\.5: 0.375rem;
        --spacing-2\\\\.5: 0.625rem;
        --spacing-3\\\\.5: 0.875rem;
        --sizes-1: 0.25rem;
        --sizes-2: 0.5rem;
        --sizes-3: 0.75rem;
        --sizes-4: 1rem;
        --sizes-5: 1.25rem;
        --sizes-6: 1.5rem;
        --sizes-0\\\\.5: 0.125rem;
        --sizes-1\\\\.5: 0.375rem;
        --sizes-2\\\\.5: 0.625rem;
        --sizes-3\\\\.5: 0.875rem;
        --large-sizes-xs: 20rem;
        --large-sizes-sm: 24rem;
        --large-sizes-md: 28rem;
        --large-sizes-lg: 32rem;
        --large-sizes-xl: 36rem;
        --animations-none: none;
        --animations-spin: spin 1s linear infinite;
        --animations-ping: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        --animations-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        --animations-bounce: bounce 1s infinite;
        --easings-ease-in: cubic-bezier(0.4, 0, 1, 1);
        --easings-ease-out: cubic-bezier(0, 0, 0.2, 1);
        --easings-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
        --durations-75: 75ms;
        --durations-100: 100ms;
        --durations-150: 150ms;
        --colors-primary: #EF4444;
        --colors-secondary: #991B1B;
        --colors-complex: #991B1B;
        --spacing-gutter: 1rem;
        --colors-palette-50: var(--colors-palette-50);
        --colors-palette-100: var(--colors-palette-100);
        --colors-palette-200: var(--colors-palette-200);
        --colors-palette-300: var(--colors-palette-300);
        --colors-palette-400: var(--colors-palette-400);
        --colors-palette-500: var(--colors-palette-500);
        --colors-palette-600: var(--colors-palette-600);
        --colors-palette-700: var(--colors-palette-700);
        --colors-palette-800: var(--colors-palette-800);
        --colors-palette-900: var(--colors-palette-900)

      }

      [data-theme=dark] {
        --colors-primary: #F87171;
        --colors-secondary: #B91C1C 
     
      }

      @media (forced-colors: active) {
        [data-theme=dark] {
          --colors-complex: #B91C1C 
     
        }
      }

      [data-color=material] {
        --colors-surface: #m-b 
     
      }

      [data-theme=dark][data-color=material] {
        --colors-surface: #m-d 
     
      }

      [data-color=pastel] {
        --colors-surface: #p-b 
     
      }

      @media screen and (min-width: 48em) {
        [data-theme=dark][data-color=pastel] {
          --colors-surface: #p-d 
     
        }
      }

      @media screen and (min-width: 62em) {
        :root {
          --spacing-gutter: 1.25rem  

        }
      }
    }
      "
  `)
})
