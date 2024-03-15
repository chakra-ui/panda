import { createContext } from '@pandacss/fixture'
import type { Config } from '@pandacss/types'
import { describe, expect, test } from 'vitest'

const tokenCss = (config?: Config) => {
  const ctx = createContext(config)
  const sheet = ctx.createSheet()
  ctx.appendCssOfType('tokens', sheet)
  return sheet.toCss({ optimize: true })
}

describe('generator', () => {
  test('[css] should generate css', () => {
    expect(tokenCss()).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(html) {
          --aspect-ratios-square: 1 / 1;
          --aspect-ratios-landscape: 4 / 3;
          --aspect-ratios-portrait: 3 / 4;
          --aspect-ratios-wide: 16 / 9;
          --aspect-ratios-ultrawide: 18 / 5;
          --aspect-ratios-golden: 1.618 / 1;
          --borders-none: none;
          --easings-default: cubic-bezier(0.4, 0, 0.2, 1);
          --easings-linear: linear;
          --easings-in: cubic-bezier(0.4, 0, 1, 1);
          --easings-out: cubic-bezier(0, 0, 0.2, 1);
          --easings-in-out: cubic-bezier(0.4, 0, 0.2, 1);
          --durations-fastest: 50ms;
          --durations-faster: 100ms;
          --durations-fast: 150ms;
          --durations-normal: 200ms;
          --durations-slow: 300ms;
          --durations-slower: 400ms;
          --durations-slowest: 500ms;
          --radii-xs: 0.125rem;
          --radii-sm: 0.25rem;
          --radii-md: 0.375rem;
          --radii-lg: 0.5rem;
          --radii-xl: 0.75rem;
          --radii-2xl: 1rem;
          --radii-3xl: 1.5rem;
          --radii-full: 9999px;
          --font-weights-thin: 100;
          --font-weights-extralight: 200;
          --font-weights-light: 300;
          --font-weights-normal: 400;
          --font-weights-medium: 500;
          --font-weights-semibold: 600;
          --font-weights-bold: 700;
          --font-weights-extrabold: 800;
          --font-weights-black: 900;
          --line-heights-none: 1;
          --line-heights-tight: 1.25;
          --line-heights-snug: 1.375;
          --line-heights-normal: 1.5;
          --line-heights-relaxed: 1.625;
          --line-heights-loose: 2;
          --fonts-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          --fonts-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
          --fonts-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          --letter-spacings-tighter: -0.05em;
          --letter-spacings-tight: -0.025em;
          --letter-spacings-normal: 0em;
          --letter-spacings-wide: 0.025em;
          --letter-spacings-wider: 0.05em;
          --letter-spacings-widest: 0.1em;
          --font-sizes-2xs: 0.5rem;
          --font-sizes-xs: 0.75rem;
          --font-sizes-sm: 0.875rem;
          --font-sizes-md: 1rem;
          --font-sizes-lg: 1.125rem;
          --font-sizes-xl: 1.25rem;
          --font-sizes-2xl: 1.5rem;
          --font-sizes-3xl: 1.875rem;
          --font-sizes-4xl: 2.25rem;
          --font-sizes-5xl: 3rem;
          --font-sizes-6xl: 3.75rem;
          --font-sizes-7xl: 4.5rem;
          --font-sizes-8xl: 6rem;
          --font-sizes-9xl: 8rem;
          --shadows-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadows-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --shadows-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --shadows-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          --shadows-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          --shadows-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
          --shadows-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
          --colors-current: currentColor;
          --colors-black: #000;
          --colors-white: #fff;
          --colors-transparent: rgb(0 0 0 / 0);
          --colors-rose-50: #fff1f2;
          --colors-rose-100: #ffe4e6;
          --colors-rose-200: #fecdd3;
          --colors-rose-300: #fda4af;
          --colors-rose-400: #fb7185;
          --colors-rose-500: #f43f5e;
          --colors-rose-600: #e11d48;
          --colors-rose-700: #be123c;
          --colors-rose-800: #9f1239;
          --colors-rose-900: #881337;
          --colors-rose-950: #4c0519;
          --colors-pink-50: #fdf2f8;
          --colors-pink-100: #fce7f3;
          --colors-pink-200: #fbcfe8;
          --colors-pink-300: #f9a8d4;
          --colors-pink-400: #f472b6;
          --colors-pink-500: #ec4899;
          --colors-pink-600: #db2777;
          --colors-pink-700: #be185d;
          --colors-pink-800: #9d174d;
          --colors-pink-900: #831843;
          --colors-pink-950: #500724;
          --colors-fuchsia-50: #fdf4ff;
          --colors-fuchsia-100: #fae8ff;
          --colors-fuchsia-200: #f5d0fe;
          --colors-fuchsia-300: #f0abfc;
          --colors-fuchsia-400: #e879f9;
          --colors-fuchsia-500: #d946ef;
          --colors-fuchsia-600: #c026d3;
          --colors-fuchsia-700: #a21caf;
          --colors-fuchsia-800: #86198f;
          --colors-fuchsia-900: #701a75;
          --colors-fuchsia-950: #4a044e;
          --colors-purple-50: #faf5ff;
          --colors-purple-100: #f3e8ff;
          --colors-purple-200: #e9d5ff;
          --colors-purple-300: #d8b4fe;
          --colors-purple-400: #c084fc;
          --colors-purple-500: #a855f7;
          --colors-purple-600: #9333ea;
          --colors-purple-700: #7e22ce;
          --colors-purple-800: #6b21a8;
          --colors-purple-900: #581c87;
          --colors-purple-950: #3b0764;
          --colors-violet-50: #f5f3ff;
          --colors-violet-100: #ede9fe;
          --colors-violet-200: #ddd6fe;
          --colors-violet-300: #c4b5fd;
          --colors-violet-400: #a78bfa;
          --colors-violet-500: #8b5cf6;
          --colors-violet-600: #7c3aed;
          --colors-violet-700: #6d28d9;
          --colors-violet-800: #5b21b6;
          --colors-violet-900: #4c1d95;
          --colors-violet-950: #2e1065;
          --colors-indigo-50: #eef2ff;
          --colors-indigo-100: #e0e7ff;
          --colors-indigo-200: #c7d2fe;
          --colors-indigo-300: #a5b4fc;
          --colors-indigo-400: #818cf8;
          --colors-indigo-500: #6366f1;
          --colors-indigo-600: #4f46e5;
          --colors-indigo-700: #4338ca;
          --colors-indigo-800: #3730a3;
          --colors-indigo-900: #312e81;
          --colors-indigo-950: #1e1b4b;
          --colors-blue-50: #eff6ff;
          --colors-blue-100: #dbeafe;
          --colors-blue-200: #bfdbfe;
          --colors-blue-300: #93c5fd;
          --colors-blue-400: #60a5fa;
          --colors-blue-500: #3b82f6;
          --colors-blue-600: #2563eb;
          --colors-blue-700: #1d4ed8;
          --colors-blue-800: #1e40af;
          --colors-blue-900: #1e3a8a;
          --colors-blue-950: #172554;
          --colors-sky-50: #f0f9ff;
          --colors-sky-100: #e0f2fe;
          --colors-sky-200: #bae6fd;
          --colors-sky-300: #7dd3fc;
          --colors-sky-400: #38bdf8;
          --colors-sky-500: #0ea5e9;
          --colors-sky-600: #0284c7;
          --colors-sky-700: #0369a1;
          --colors-sky-800: #075985;
          --colors-sky-900: #0c4a6e;
          --colors-sky-950: #082f49;
          --colors-cyan-50: #ecfeff;
          --colors-cyan-100: #cffafe;
          --colors-cyan-200: #a5f3fc;
          --colors-cyan-300: #67e8f9;
          --colors-cyan-400: #22d3ee;
          --colors-cyan-500: #06b6d4;
          --colors-cyan-600: #0891b2;
          --colors-cyan-700: #0e7490;
          --colors-cyan-800: #155e75;
          --colors-cyan-900: #164e63;
          --colors-cyan-950: #083344;
          --colors-teal-50: #f0fdfa;
          --colors-teal-100: #ccfbf1;
          --colors-teal-200: #99f6e4;
          --colors-teal-300: #5eead4;
          --colors-teal-400: #2dd4bf;
          --colors-teal-500: #14b8a6;
          --colors-teal-600: #0d9488;
          --colors-teal-700: #0f766e;
          --colors-teal-800: #115e59;
          --colors-teal-900: #134e4a;
          --colors-teal-950: #042f2e;
          --colors-emerald-50: #ecfdf5;
          --colors-emerald-100: #d1fae5;
          --colors-emerald-200: #a7f3d0;
          --colors-emerald-300: #6ee7b7;
          --colors-emerald-400: #34d399;
          --colors-emerald-500: #10b981;
          --colors-emerald-600: #059669;
          --colors-emerald-700: #047857;
          --colors-emerald-800: #065f46;
          --colors-emerald-900: #064e3b;
          --colors-emerald-950: #022c22;
          --colors-green-50: #f0fdf4;
          --colors-green-100: #dcfce7;
          --colors-green-200: #bbf7d0;
          --colors-green-300: #86efac;
          --colors-green-400: #4ade80;
          --colors-green-500: #22c55e;
          --colors-green-600: #16a34a;
          --colors-green-700: #15803d;
          --colors-green-800: #166534;
          --colors-green-900: #14532d;
          --colors-green-950: #052e16;
          --colors-lime-50: #f7fee7;
          --colors-lime-100: #ecfccb;
          --colors-lime-200: #d9f99d;
          --colors-lime-300: #bef264;
          --colors-lime-400: #a3e635;
          --colors-lime-500: #84cc16;
          --colors-lime-600: #65a30d;
          --colors-lime-700: #4d7c0f;
          --colors-lime-800: #3f6212;
          --colors-lime-900: #365314;
          --colors-lime-950: #1a2e05;
          --colors-yellow-50: #fefce8;
          --colors-yellow-100: #fef9c3;
          --colors-yellow-200: #fef08a;
          --colors-yellow-300: #fde047;
          --colors-yellow-400: #facc15;
          --colors-yellow-500: #eab308;
          --colors-yellow-600: #ca8a04;
          --colors-yellow-700: #a16207;
          --colors-yellow-800: #854d0e;
          --colors-yellow-900: #713f12;
          --colors-yellow-950: #422006;
          --colors-amber-50: #fffbeb;
          --colors-amber-100: #fef3c7;
          --colors-amber-200: #fde68a;
          --colors-amber-300: #fcd34d;
          --colors-amber-400: #fbbf24;
          --colors-amber-500: #f59e0b;
          --colors-amber-600: #d97706;
          --colors-amber-700: #b45309;
          --colors-amber-800: #92400e;
          --colors-amber-900: #78350f;
          --colors-amber-950: #451a03;
          --colors-orange-50: #fff7ed;
          --colors-orange-100: #ffedd5;
          --colors-orange-200: #fed7aa;
          --colors-orange-300: #fdba74;
          --colors-orange-400: #fb923c;
          --colors-orange-500: #f97316;
          --colors-orange-600: #ea580c;
          --colors-orange-700: #c2410c;
          --colors-orange-800: #9a3412;
          --colors-orange-900: #7c2d12;
          --colors-orange-950: #431407;
          --colors-red-50: #fef2f2;
          --colors-red-100: #fee2e2;
          --colors-red-200: #fecaca;
          --colors-red-300: #fca5a5;
          --colors-red-400: #f87171;
          --colors-red-500: #ef4444;
          --colors-red-600: #dc2626;
          --colors-red-700: #b91c1c;
          --colors-red-800: #991b1b;
          --colors-red-900: #7f1d1d;
          --colors-red-950: #450a0a;
          --colors-neutral-50: #fafafa;
          --colors-neutral-100: #f5f5f5;
          --colors-neutral-200: #e5e5e5;
          --colors-neutral-300: #d4d4d4;
          --colors-neutral-400: #a3a3a3;
          --colors-neutral-500: #737373;
          --colors-neutral-600: #525252;
          --colors-neutral-700: #404040;
          --colors-neutral-800: #262626;
          --colors-neutral-900: #171717;
          --colors-neutral-950: #0a0a0a;
          --colors-stone-50: #fafaf9;
          --colors-stone-100: #f5f5f4;
          --colors-stone-200: #e7e5e4;
          --colors-stone-300: #d6d3d1;
          --colors-stone-400: #a8a29e;
          --colors-stone-500: #78716c;
          --colors-stone-600: #57534e;
          --colors-stone-700: #44403c;
          --colors-stone-800: #292524;
          --colors-stone-900: #1c1917;
          --colors-stone-950: #0c0a09;
          --colors-zinc-50: #fafafa;
          --colors-zinc-100: #f4f4f5;
          --colors-zinc-200: #e4e4e7;
          --colors-zinc-300: #d4d4d8;
          --colors-zinc-400: #a1a1aa;
          --colors-zinc-500: #71717a;
          --colors-zinc-600: #52525b;
          --colors-zinc-700: #3f3f46;
          --colors-zinc-800: #27272a;
          --colors-zinc-900: #18181b;
          --colors-zinc-950: #09090b;
          --colors-gray-50: #f9fafb;
          --colors-gray-100: #f3f4f6;
          --colors-gray-200: #e5e7eb;
          --colors-gray-300: #d1d5db;
          --colors-gray-400: #9ca3af;
          --colors-gray-500: #6b7280;
          --colors-gray-600: #4b5563;
          --colors-gray-700: #374151;
          --colors-gray-800: #1f2937;
          --colors-gray-900: #111827;
          --colors-gray-950: #030712;
          --colors-slate-50: #f8fafc;
          --colors-slate-100: #f1f5f9;
          --colors-slate-200: #e2e8f0;
          --colors-slate-300: #cbd5e1;
          --colors-slate-400: #94a3b8;
          --colors-slate-500: #64748b;
          --colors-slate-600: #475569;
          --colors-slate-700: #334155;
          --colors-slate-800: #1e293b;
          --colors-slate-900: #0f172a;
          --colors-slate-950: #020617;
          --colors-deep-test-yam: %555;
          --colors-deep-test-pool-poller: #fff;
          --colors-deep-test-pool-tall: $dfdf;
          --blurs-sm: 4px;
          --blurs-base: 8px;
          --blurs-md: 12px;
          --blurs-lg: 16px;
          --blurs-xl: 24px;
          --blurs-2xl: 40px;
          --blurs-3xl: 64px;
          --spacing-0: 0rem;
          --spacing-1: 0.25rem;
          --spacing-2: 0.5rem;
          --spacing-3: 0.75rem;
          --spacing-4: 1rem;
          --spacing-5: 1.25rem;
          --spacing-6: 1.5rem;
          --spacing-7: 1.75rem;
          --spacing-8: 2rem;
          --spacing-9: 2.25rem;
          --spacing-10: 2.5rem;
          --spacing-11: 2.75rem;
          --spacing-12: 3rem;
          --spacing-14: 3.5rem;
          --spacing-16: 4rem;
          --spacing-20: 5rem;
          --spacing-24: 6rem;
          --spacing-28: 7rem;
          --spacing-32: 8rem;
          --spacing-36: 9rem;
          --spacing-40: 10rem;
          --spacing-44: 11rem;
          --spacing-48: 12rem;
          --spacing-52: 13rem;
          --spacing-56: 14rem;
          --spacing-60: 15rem;
          --spacing-64: 16rem;
          --spacing-72: 18rem;
          --spacing-80: 20rem;
          --spacing-96: 24rem;
          --spacing-0\\.5: 0.125rem;
          --spacing-1\\.5: 0.375rem;
          --spacing-2\\.5: 0.625rem;
          --spacing-3\\.5: 0.875rem;
          --sizes-0: 0rem;
          --sizes-1: 0.25rem;
          --sizes-2: 0.5rem;
          --sizes-3: 0.75rem;
          --sizes-4: 1rem;
          --sizes-5: 1.25rem;
          --sizes-6: 1.5rem;
          --sizes-7: 1.75rem;
          --sizes-8: 2rem;
          --sizes-9: 2.25rem;
          --sizes-10: 2.5rem;
          --sizes-11: 2.75rem;
          --sizes-12: 3rem;
          --sizes-14: 3.5rem;
          --sizes-16: 4rem;
          --sizes-20: 5rem;
          --sizes-24: 6rem;
          --sizes-28: 7rem;
          --sizes-32: 8rem;
          --sizes-36: 9rem;
          --sizes-40: 10rem;
          --sizes-44: 11rem;
          --sizes-48: 12rem;
          --sizes-52: 13rem;
          --sizes-56: 14rem;
          --sizes-60: 15rem;
          --sizes-64: 16rem;
          --sizes-72: 18rem;
          --sizes-80: 20rem;
          --sizes-96: 24rem;
          --sizes-0\\.5: 0.125rem;
          --sizes-1\\.5: 0.375rem;
          --sizes-2\\.5: 0.625rem;
          --sizes-3\\.5: 0.875rem;
          --sizes-xs: 20rem;
          --sizes-sm: 24rem;
          --sizes-md: 28rem;
          --sizes-lg: 32rem;
          --sizes-xl: 36rem;
          --sizes-2xl: 42rem;
          --sizes-3xl: 48rem;
          --sizes-4xl: 56rem;
          --sizes-5xl: 64rem;
          --sizes-6xl: 72rem;
          --sizes-7xl: 80rem;
          --sizes-8xl: 90rem;
          --sizes-prose: 65ch;
          --sizes-full: 100%;
          --sizes-min: min-content;
          --sizes-max: max-content;
          --sizes-fit: fit-content;
          --sizes-breakpoint-sm: 640px;
          --sizes-breakpoint-md: 768px;
          --sizes-breakpoint-lg: 1024px;
          --sizes-breakpoint-xl: 1280px;
          --sizes-breakpoint-2xl: 1536px;
          --animations-spin: spin 1s linear infinite;
          --animations-ping: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          --animations-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          --animations-bounce: bounce 1s infinite;
          --breakpoints-sm: 640px;
          --breakpoints-md: 768px;
          --breakpoints-lg: 1024px;
          --breakpoints-xl: 1280px;
          --breakpoints-2xl: 1536px;
          --colors-primary: var(--colors-red-500);
          --colors-secondary: var(--colors-red-800);
          --colors-complex: var(--colors-red-800);
          --colors-button-thick: #fff;
          --colors-button-card-body: #fff;
          --colors-button-card-heading: #fff;
          --spacing-gutter: var(--spacing-4);
      }

        :where([data-theme=dark], .dark) {
          --colors-primary: var(--colors-red-400);
          --colors-secondary: var(--colors-red-700);
          --colors-button-thick: #000;
          --colors-button-card-body: #000;
          --colors-button-card-heading: #000
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

        @media screen and (min-width: 48rem) {
          [data-color=pastel]:where([data-theme=dark], .dark) {
            --colors-surface: #p-d
                      }
                  }

        @media screen and (min-width: 64rem) {
          :where(html) {
            --spacing-gutter: var(--spacing-5)
              }
          }

        @media (forced-colors: active) {
          :where([data-theme=dark], .dark) {
            --colors-complex: var(--colors-red-700)
                  }
              }
      }"
    `)
  })

  // https://github.com/chakra-ui/panda/issues/769
  describe('issue 769: Invalid CSS when extending theme with semanticTokens', () => {
    test('should not extract nested tokens as `color-palette` css variables', () => {
      const css = tokenCss({
        theme: {
          tokens: {
            colors: {
              single: {
                value: '#ef4444',
              },
              test: {
                50: {
                  value: '#f9f9f9',
                },
                100: {
                  value: '#f2f2f2',
                },
              },
              deep: {
                test: {
                  yam: {
                    value: '%555',
                  },
                  pool: {
                    poller: {
                      value: '#fff',
                    },
                    tall: {
                      value: '$dfdf',
                    },
                    palette: {
                      50: {
                        value: '#f9f9f9',
                      },
                      100: {
                        value: '#f2f2f2',
                      },
                      200: {
                        value: '#ebebeb',
                      },
                    },
                  },
                },
              },
            },
          },
          semanticTokens: {},
          breakpoints: {},
        },
        conditions: {
          dark: '.dark &',
        },
      })

      expect(css).toMatchInlineSnapshot(`
        "@layer tokens {
          :where(html) {
            --colors-single: #ef4444;
            --colors-test-50: #f9f9f9;
            --colors-test-100: #f2f2f2;
            --colors-deep-test-yam: %555;
            --colors-deep-test-pool-poller: #fff;
            --colors-deep-test-pool-tall: $dfdf;
            --colors-deep-test-pool-palette-50: #f9f9f9;
            --colors-deep-test-pool-palette-100: #f2f2f2;
            --colors-deep-test-pool-palette-200: #ebebeb;
        }
        }"
      `)
    })

    test('should not extract shadow array as a separate unnamed block for the custom dark condition', () => {
      const css = tokenCss({
        theme: {
          tokens: {},
          breakpoints: {},
          semanticTokens: {
            shadows: {
              e1: {
                value: {
                  base: ['0px 1px 2px rgba(0, 0, 0, 0.3)', '0px 1px 3px 1px rgba(0, 0, 0, 0.15)'],
                  _dark: ['0px 1px 3px 1px rgba(0, 0, 0, 0.15)', '0px 1px 2px rgba(0, 0, 0, 0.3)'],
                },
              },
            },
          },
        },
        conditions: {
          dark: '.dark &',
        },
      })

      expect(css).toMatchInlineSnapshot(`
        "@layer tokens {
          :where(html) {
            --shadows-e1: 0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
        }

          .dark {
            --shadows-e1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px rgba(0, 0, 0, 0.3)
        }
        }"
      `)
    })
  })

  test('should reuse css variable in semantic token alias', () => {
    const css = tokenCss({
      theme: {
        tokens: {
          colors: {
            red: {
              value: '#ef4444',
            },
            semanticRed: {
              value: '{colors.danger}',
            },
          },
          borders: {
            red: {
              value: '1px solid {colors.red}',
            },
            semanticRed: {
              value: '{borders.danger}',
            },
          },
        },
        semanticTokens: {
          colors: {
            danger: {
              value: '{colors.red}',
            },
          },
          borders: {
            danger: {
              value: '{borders.red}',
            },
          },
        },
        breakpoints: {},
      },
      conditions: {
        dark: '.dark &',
      },
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(html) {
          --colors-red: #ef4444;
          --colors-semantic-red: var(--colors-danger);
          --borders-red: 1px solid var(--colors-red);
          --borders-semantic-red: var(--borders-danger);
          --colors-danger: var(--colors-red);
          --borders-danger: var(--borders-red);
      }
      }"
    `)
  })

  test('shadow semantic tokens', () => {
    const css = tokenCss({
      theme: {
        tokens: {
          shadows: {
            test1: {
              value: {
                offsetX: 0,
                offsetY: 0,
                blur: 0,
                spread: 4,
                color: '{colors.testPink}',
              },
            },
          },
        },
        semanticTokens: {
          colors: {
            testPink: { value: '{colors.pink.900}' },
          },
          shadows: {
            testBrokenShadow: {
              value: {
                offsetX: 0,
                offsetY: 0,
                blur: 0,
                spread: 4,
                color: '{colors.testPink}',
              },
            },
            complexShadow: {
              value: {
                base: {
                  offsetX: 0,
                  offsetY: 0,
                  blur: 0,
                  spread: 4,
                  color: '{colors.testPink}',
                },
                _dark: {
                  offsetX: 2,
                  offsetY: 8,
                  blur: 30,
                  spread: 4,
                  color: '{colors.testPink}',
                },
              },
            },
          },
        },
        breakpoints: {},
      },
      conditions: {
        dark: '.dark &',
      },
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(html) {
          --shadows-test1: 0px 0px 0px 4px var(--colors-test-pink);
          --colors-test-pink: var(--colors-pink-900);
          --shadows-test-broken-shadow: 0px 0px 0px 4px var(--colors-test-pink);
          --shadows-complex-shadow: 0px 0px 0px 4px var(--colors-test-pink);
      }

        .dark {
          --shadows-complex-shadow: 2px 8px 30px 4px var(--colors-test-pink)
      }
      }"
    `)
  })

  test('assets svg', () => {
    const css = tokenCss({
      eject: true,
      theme: {
        tokens: {
          assets: {
            checkbox: {
              value: {
                type: 'svg',
                value: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h8"/></svg>`,
              },
            },
          },
        },
      },
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(html) {
          --assets-checkbox: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e");
      }
      }"
    `)
  })

  test('color-mix', () => {
    const css = tokenCss({
      eject: true,
      theme: {
        tokens: {
          colors: {
            pink: { value: '#ff00ff' },
            border: { value: '{colors.pink/30}' },
            ref: { value: '{colors.border/40}' },
          },
          opacity: {
            half: { value: 0.5 },
          },
        },
        semanticTokens: {
          colors: {
            primary: {
              value: '{colors.blue.300/70}',
            },
          },
        },
      },
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(html) {
          --colors-pink: #ff00ff;
          --colors-border: color-mix(in srgb, var(--colors-pink) 30%, transparent);
          --colors-ref: color-mix(in srgb, var(--colors-border) 40%, transparent);
          --opacity-half: 0.5;
          --colors-primary: color-mix(in srgb, colors.blue.300 70%, transparent);
      }
      }"
    `)
  })

  test('color-mix in semanticTokens conditions', () => {
    const css = tokenCss({
      eject: true,
      conditions: {
        light: '.light &',
        dark: '.dark &',
      },
      theme: {
        tokens: {
          colors: {
            blue: { 500: { value: 'blue' } },
            green: { 500: { value: 'green' } },
          },
          opacity: {
            half: { value: 0.5 },
          },
        },
        semanticTokens: {
          colors: {
            secondary: {
              value: {
                base: 'red',
                _light: '{colors.blue.500/32}',
                _dark: '{colors.green.500/half}',
              },
            },
          },
        },
      },
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(html) {
          --colors-blue-500: blue;
          --colors-green-500: green;
          --opacity-half: 0.5;
          --colors-secondary: red;
      }

        .light {
          --colors-secondary: color-mix(in srgb, var(--colors-blue-500) 32%, transparent)
      }

        .dark {
          --colors-secondary: color-mix(in srgb, var(--colors-green-500) 50%, transparent)
      }
      }"
    `)
  })

  test('themes - no staticCss', () => {
    const css = tokenCss({
      eject: true,
      conditions: {
        osDark: '@media (prefers-color-scheme: dark)',
      },
      theme: {
        tokens: {
          colors: {
            text: { value: 'blue' },
          },
        },
        semanticTokens: {
          colors: {
            body: {
              value: {
                base: '{colors.blue.600}',
                _osDark: '{colors.blue.400}',
              },
            },
          },
        },
      },
      // alternative theme variants
      themes: {
        primary: {
          tokens: {
            colors: {
              text: { value: 'red' },
            },
          },
          semanticTokens: {
            colors: {
              muted: { value: '{colors.red.200}' },
              body: {
                value: {
                  base: '{colors.red.600}',
                  _osDark: '{colors.red.400}',
                },
              },
            },
          },
        },
      },
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(html) {
          --colors-text: blue;
          --colors-body: var(--colors-blue-600);
      }

        @media (prefers-color-scheme: dark) {
          :where(html) {
            --colors-body: var(--colors-blue-400)
              }
          }
      }"
    `)
  })

  test('themes - staticCss with name', () => {
    const css = tokenCss({
      eject: true,
      conditions: {
        osDark: '@media (prefers-color-scheme: dark)',
      },
      theme: {
        tokens: {
          colors: {
            text: { value: 'blue' },
          },
        },
        semanticTokens: {
          colors: {
            body: {
              value: {
                base: '{colors.blue.600}',
                _osDark: '{colors.blue.400}',
              },
            },
          },
        },
      },
      // alternative theme variants
      themes: {
        primary: {
          tokens: {
            colors: {
              text: { value: 'red' },
            },
          },
          semanticTokens: {
            colors: {
              muted: { value: '{colors.red.200}' },
              body: {
                value: {
                  base: '{colors.red.600}',
                  _osDark: '{colors.red.400}',
                },
              },
            },
          },
        },
      },
      staticCss: {
        // only generate the red in addition to the main one
        themes: ['primary'],
        // use  ['*'] to generate all themes
      },
      outdir: '',
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(html) {
          --colors-text: blue;
          --colors-body: var(--colors-blue-600);
      }

        [data-theme=primary] {
          --colors-text: red;
          --colors-muted: var(--colors-red-200);
          --colors-body: var(--colors-red-600)
      }

        @media (prefers-color-scheme: dark) {
          :where(html) {
            --colors-body: var(--colors-blue-400)
              }
          }

        @media (prefers-color-scheme: dark) {
          [data-theme=primary] {
            --colors-body: var(--colors-red-400)
                  }
              }
      }"
    `)
  })

  test('themes - staticCss with *', () => {
    const css = tokenCss({
      eject: true,
      conditions: {
        osDark: '@media (prefers-color-scheme: dark)',
      },
      theme: {
        tokens: {
          colors: {
            text: { value: 'blue' },
          },
        },
        semanticTokens: {
          colors: {
            body: {
              value: {
                base: '{colors.blue.600}',
                _osDark: '{colors.blue.400}',
              },
            },
          },
        },
      },
      // alternative theme variants
      themes: {
        primary: {
          tokens: {
            colors: {
              text: { value: 'red' },
            },
          },
          semanticTokens: {
            colors: {
              muted: { value: '{colors.red.200}' },
              body: {
                value: {
                  base: '{colors.red.600}',
                  _osDark: '{colors.red.400}',
                },
              },
            },
          },
        },
      },
      staticCss: {
        // only generate the red in addition to the main one
        themes: ['*'],
        // use  ['*'] to generate all themes
      },
      outdir: '',
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(html) {
          --colors-text: blue;
          --colors-body: var(--colors-blue-600);
      }

        [data-theme=primary] {
          --colors-text: red;
          --colors-muted: var(--colors-red-200);
          --colors-body: var(--colors-red-600)
      }

        @media (prefers-color-scheme: dark) {
          :where(html) {
            --colors-body: var(--colors-blue-400)
              }
          }

        @media (prefers-color-scheme: dark) {
          [data-theme=primary] {
            --colors-body: var(--colors-red-400)
                  }
              }
      }"
    `)
  })
})
