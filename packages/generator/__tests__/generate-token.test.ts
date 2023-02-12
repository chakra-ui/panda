import { describe, expect, test } from 'vitest'
import { generateTokenCss } from '../src/artifacts/css/token-css'
import { generator } from './fixture'

describe('generator', () => {
  test('[css] should generate css', () => {
    const css = generateTokenCss(generator)

    expect(css).toMatchInlineSnapshot(`
      "@layer tokens {
          :where(html) {
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
        --colors-gray-deep-test-yam: %555;
        --colors-gray-deep-test-pool-poller: #fff;
        --colors-gray-deep-test-pool-tall: $dfdf;
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
        --sizes-xs: 20rem;
        --sizes-sm: 24rem;
        --sizes-md: 28rem;
        --sizes-lg: 32rem;
        --sizes-xl: 36rem;
        --sizes-breakpoint-sm: 30em;
        --sizes-breakpoint-md: 48em;
        --sizes-breakpoint-lg: 62em;
        --sizes-breakpoint-xl: 80em;
        --sizes-breakpoint-2xl: 96em;
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
        --breakpoints-sm: 30em;
        --breakpoints-md: 48em;
        --breakpoints-lg: 62em;
        --breakpoints-xl: 80em;
        --breakpoints-2xl: 96em;
        --colors-primary: #EF4444;
        --colors-secondary: #991B1B;
        --colors-complex: #991B1B;
        --colors-button-thick: #fff;
        --colors-button-card-body: #fff;
        --colors-button-card-heading: #fff;
        --spacing-gutter: 1rem;
        --colors-color-palette-50: var(--colors-color-palette-50);
        --colors-color-palette-100: var(--colors-color-palette-100);
        --colors-color-palette-200: var(--colors-color-palette-200);
        --colors-color-palette-300: var(--colors-color-palette-300);
        --colors-color-palette-400: var(--colors-color-palette-400);
        --colors-color-palette-500: var(--colors-color-palette-500);
        --colors-color-palette-600: var(--colors-color-palette-600);
        --colors-color-palette-700: var(--colors-color-palette-700);
        --colors-color-palette-800: var(--colors-color-palette-800);
        --colors-color-palette-900: var(--colors-color-palette-900);
        --colors-color-palette-yam: var(--colors-color-palette-yam);
        --colors-color-palette-poller: var(--colors-color-palette-poller);
        --colors-color-palette-tall: var(--colors-color-palette-tall);
        --colors-color-palette-thick: var(--colors-color-palette-thick);
        --colors-color-palette-body: var(--colors-color-palette-body);
        --colors-color-palette-heading: var(--colors-color-palette-heading)
      }

      :where([data-theme=dark], .dark) {
        --colors-primary: #F87171;
        --colors-secondary: #B91C1C;
        --colors-button-thick: #000;
        --colors-button-card-body: #000;
        --colors-button-card-heading: #000
      }

      @media (forced-colors: active) {
        :where([data-theme=dark], .dark) {
          --colors-complex: #B91C1C
                  }
              }

      [data-color=material] {
        --colors-surface: #m-b
      }

      [data-color=material]:where([data-theme=dark], .dark) {
        --colors-surface: #m-d
              }

      [data-color=pastel] {
        --colors-surface: #p-b
      }

      @media screen and (min-width: 48em) {
        [data-color=pastel]:where([data-theme=dark], .dark) {
          --colors-surface: #p-d
                      }
                  }

      @media screen and (min-width: 62em) {
        :where(html) {
          --spacing-gutter: 1.25rem
              }
          }
        }
        "
    `)
  })
})
