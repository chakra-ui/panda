import { expect, test } from 'vitest'
import { generateTokenJs } from '../src/artifacts/js/token'
import { generator } from './fixture'

test('[dts] should generate package', () => {
  expect(generateTokenJs(generator).js).toMatchInlineSnapshot(
    `
    "const tokens = {
      \\"fonts.heading\\": {
        \\"value\\": \\"-apple-system, BlinkMacSystemFont\\",
        \\"variable\\": \\"var(--fonts-heading)\\"
      },
      \\"fonts.body\\": {
        \\"value\\": \\"Helvetica, Arial, sans-serif\\",
        \\"variable\\": \\"var(--fonts-body)\\"
      },
      \\"fonts.mono\\": {
        \\"value\\": \\"SFMono-Regular, Menlo, Monaco\\",
        \\"variable\\": \\"var(--fonts-mono)\\"
      },
      \\"colors.current\\": {
        \\"value\\": \\"currentColor\\",
        \\"variable\\": \\"var(--colors-current)\\"
      },
      \\"colors.gray.50\\": {
        \\"value\\": \\"#FAFAFA\\",
        \\"variable\\": \\"var(--colors-gray-50)\\"
      },
      \\"colors.gray.100\\": {
        \\"value\\": \\"#F5F5F5\\",
        \\"variable\\": \\"var(--colors-gray-100)\\"
      },
      \\"colors.gray.200\\": {
        \\"value\\": \\"#E5E5E5\\",
        \\"variable\\": \\"var(--colors-gray-200)\\"
      },
      \\"colors.gray.300\\": {
        \\"value\\": \\"#D4D4D4\\",
        \\"variable\\": \\"var(--colors-gray-300)\\"
      },
      \\"colors.gray.400\\": {
        \\"value\\": \\"#A3A3A3\\",
        \\"variable\\": \\"var(--colors-gray-400)\\"
      },
      \\"colors.gray.500\\": {
        \\"value\\": \\"#737373\\",
        \\"variable\\": \\"var(--colors-gray-500)\\"
      },
      \\"colors.gray.600\\": {
        \\"value\\": \\"#525252\\",
        \\"variable\\": \\"var(--colors-gray-600)\\"
      },
      \\"colors.gray.700\\": {
        \\"value\\": \\"#333333\\",
        \\"variable\\": \\"var(--colors-gray-700)\\"
      },
      \\"colors.gray.800\\": {
        \\"value\\": \\"#121212\\",
        \\"variable\\": \\"var(--colors-gray-800)\\"
      },
      \\"colors.gray.900\\": {
        \\"value\\": \\"#0A0A0A\\",
        \\"variable\\": \\"var(--colors-gray-900)\\"
      },
      \\"colors.gray.deep.test.yam\\": {
        \\"value\\": \\"%555\\",
        \\"variable\\": \\"var(--colors-gray-deep-test-yam)\\"
      },
      \\"colors.gray.deep.test.pool.poller\\": {
        \\"value\\": \\"#fff\\",
        \\"variable\\": \\"var(--colors-gray-deep-test-pool-poller)\\"
      },
      \\"colors.gray.deep.test.pool.tall\\": {
        \\"value\\": \\"$dfdf\\",
        \\"variable\\": \\"var(--colors-gray-deep-test-pool-tall)\\"
      },
      \\"colors.green.50\\": {
        \\"value\\": \\"#F0FFF4\\",
        \\"variable\\": \\"var(--colors-green-50)\\"
      },
      \\"colors.green.100\\": {
        \\"value\\": \\"#C6F6D5\\",
        \\"variable\\": \\"var(--colors-green-100)\\"
      },
      \\"colors.green.200\\": {
        \\"value\\": \\"#9AE6B4\\",
        \\"variable\\": \\"var(--colors-green-200)\\"
      },
      \\"colors.green.300\\": {
        \\"value\\": \\"#68D391\\",
        \\"variable\\": \\"var(--colors-green-300)\\"
      },
      \\"colors.green.400\\": {
        \\"value\\": \\"#48BB78\\",
        \\"variable\\": \\"var(--colors-green-400)\\"
      },
      \\"colors.green.500\\": {
        \\"value\\": \\"#38A169\\",
        \\"variable\\": \\"var(--colors-green-500)\\"
      },
      \\"colors.green.600\\": {
        \\"value\\": \\"#2F855A\\",
        \\"variable\\": \\"var(--colors-green-600)\\"
      },
      \\"colors.green.700\\": {
        \\"value\\": \\"#276749\\",
        \\"variable\\": \\"var(--colors-green-700)\\"
      },
      \\"colors.green.800\\": {
        \\"value\\": \\"#22543D\\",
        \\"variable\\": \\"var(--colors-green-800)\\"
      },
      \\"colors.green.900\\": {
        \\"value\\": \\"#1C4532\\",
        \\"variable\\": \\"var(--colors-green-900)\\"
      },
      \\"colors.red.50\\": {
        \\"value\\": \\"#FEF2F2\\",
        \\"variable\\": \\"var(--colors-red-50)\\"
      },
      \\"colors.red.100\\": {
        \\"value\\": \\"#FEE2E2\\",
        \\"variable\\": \\"var(--colors-red-100)\\"
      },
      \\"colors.red.200\\": {
        \\"value\\": \\"#FECACA\\",
        \\"variable\\": \\"var(--colors-red-200)\\"
      },
      \\"colors.red.300\\": {
        \\"value\\": \\"#FCA5A5\\",
        \\"variable\\": \\"var(--colors-red-300)\\"
      },
      \\"colors.red.400\\": {
        \\"value\\": \\"#F87171\\",
        \\"variable\\": \\"var(--colors-red-400)\\"
      },
      \\"colors.red.500\\": {
        \\"value\\": \\"#EF4444\\",
        \\"variable\\": \\"var(--colors-red-500)\\"
      },
      \\"colors.red.600\\": {
        \\"value\\": \\"#DC2626\\",
        \\"variable\\": \\"var(--colors-red-600)\\"
      },
      \\"colors.red.700\\": {
        \\"value\\": \\"#B91C1C\\",
        \\"variable\\": \\"var(--colors-red-700)\\"
      },
      \\"colors.red.800\\": {
        \\"value\\": \\"#991B1B\\",
        \\"variable\\": \\"var(--colors-red-800)\\"
      },
      \\"colors.red.900\\": {
        \\"value\\": \\"#7F1D1D\\",
        \\"variable\\": \\"var(--colors-red-900)\\"
      },
      \\"fontSizes.sm\\": {
        \\"value\\": \\"0.5rem\\",
        \\"variable\\": \\"var(--font-sizes-sm)\\"
      },
      \\"fontSizes.xs\\": {
        \\"value\\": \\"0.75rem\\",
        \\"variable\\": \\"var(--font-sizes-xs)\\"
      },
      \\"fontSizes.md\\": {
        \\"value\\": \\"0.875rem\\",
        \\"variable\\": \\"var(--font-sizes-md)\\"
      },
      \\"fontSizes.lg\\": {
        \\"value\\": \\"1.125rem\\",
        \\"variable\\": \\"var(--font-sizes-lg)\\"
      },
      \\"fontSizes.xl\\": {
        \\"value\\": \\"1.25rem\\",
        \\"variable\\": \\"var(--font-sizes-xl)\\"
      },
      \\"lineHeights.normal\\": {
        \\"value\\": \\"normal\\",
        \\"variable\\": \\"var(--line-heights-normal)\\"
      },
      \\"lineHeights.none\\": {
        \\"value\\": \\"1\\",
        \\"variable\\": \\"var(--line-heights-none)\\"
      },
      \\"lineHeights.shorter\\": {
        \\"value\\": \\"1.25\\",
        \\"variable\\": \\"var(--line-heights-shorter)\\"
      },
      \\"lineHeights.short\\": {
        \\"value\\": \\"1.375\\",
        \\"variable\\": \\"var(--line-heights-short)\\"
      },
      \\"lineHeights.base\\": {
        \\"value\\": \\"1.5\\",
        \\"variable\\": \\"var(--line-heights-base)\\"
      },
      \\"lineHeights.tall\\": {
        \\"value\\": \\"1.625\\",
        \\"variable\\": \\"var(--line-heights-tall)\\"
      },
      \\"lineHeights.taller\\": {
        \\"value\\": \\"2\\",
        \\"variable\\": \\"var(--line-heights-taller)\\"
      },
      \\"fontWeights.normal\\": {
        \\"value\\": \\"400\\",
        \\"variable\\": \\"var(--font-weights-normal)\\"
      },
      \\"fontWeights.medium\\": {
        \\"value\\": \\"500\\",
        \\"variable\\": \\"var(--font-weights-medium)\\"
      },
      \\"fontWeights.semibold\\": {
        \\"value\\": \\"600\\",
        \\"variable\\": \\"var(--font-weights-semibold)\\"
      },
      \\"fontWeights.bold\\": {
        \\"value\\": \\"700\\",
        \\"variable\\": \\"var(--font-weights-bold)\\"
      },
      \\"letterSpacings.tighter\\": {
        \\"value\\": \\"-0.05em\\",
        \\"variable\\": \\"var(--letter-spacings-tighter)\\"
      },
      \\"letterSpacings.tight\\": {
        \\"value\\": \\"-0.025em\\",
        \\"variable\\": \\"var(--letter-spacings-tight)\\"
      },
      \\"letterSpacings.normal\\": {
        \\"value\\": \\"0\\",
        \\"variable\\": \\"var(--letter-spacings-normal)\\"
      },
      \\"letterSpacings.wide\\": {
        \\"value\\": \\"0.025em\\",
        \\"variable\\": \\"var(--letter-spacings-wide)\\"
      },
      \\"letterSpacings.wider\\": {
        \\"value\\": \\"0.05em\\",
        \\"variable\\": \\"var(--letter-spacings-wider)\\"
      },
      \\"letterSpacings.widest\\": {
        \\"value\\": \\"0.1em\\",
        \\"variable\\": \\"var(--letter-spacings-widest)\\"
      },
      \\"radii.none\\": {
        \\"value\\": \\"0\\",
        \\"variable\\": \\"var(--radii-none)\\"
      },
      \\"radii.sm\\": {
        \\"value\\": \\"0.125rem\\",
        \\"variable\\": \\"var(--radii-sm)\\"
      },
      \\"radii.base\\": {
        \\"value\\": \\"0.25rem\\",
        \\"variable\\": \\"var(--radii-base)\\"
      },
      \\"radii.md\\": {
        \\"value\\": \\"0.375rem\\",
        \\"variable\\": \\"var(--radii-md)\\"
      },
      \\"radii.lg\\": {
        \\"value\\": \\"0.5rem\\",
        \\"variable\\": \\"var(--radii-lg)\\"
      },
      \\"radii.xl\\": {
        \\"value\\": \\"0.75rem\\",
        \\"variable\\": \\"var(--radii-xl)\\"
      },
      \\"radii.2xl\\": {
        \\"value\\": \\"1rem\\",
        \\"variable\\": \\"var(--radii-2xl)\\"
      },
      \\"radii.3xl\\": {
        \\"value\\": \\"1.5rem\\",
        \\"variable\\": \\"var(--radii-3xl)\\"
      },
      \\"radii.full\\": {
        \\"value\\": \\"9999px\\",
        \\"variable\\": \\"var(--radii-full)\\"
      },
      \\"shadows.xs\\": {
        \\"value\\": \\"0 0 0 1px rgba(0, 0, 0, 0.05)\\",
        \\"variable\\": \\"var(--shadows-xs)\\"
      },
      \\"shadows.sm\\": {
        \\"value\\": \\"0 1px 2px 0 rgba(0, 0, 0, 0.05)\\",
        \\"variable\\": \\"var(--shadows-sm)\\"
      },
      \\"shadows.base\\": {
        \\"value\\": \\"0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)\\",
        \\"variable\\": \\"var(--shadows-base)\\"
      },
      \\"shadows.md\\": {
        \\"value\\": \\"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)\\",
        \\"variable\\": \\"var(--shadows-md)\\"
      },
      \\"spacing.1\\": {
        \\"value\\": \\"0.25rem\\",
        \\"variable\\": \\"var(--spacing-1)\\"
      },
      \\"spacing.2\\": {
        \\"value\\": \\"0.5rem\\",
        \\"variable\\": \\"var(--spacing-2)\\"
      },
      \\"spacing.3\\": {
        \\"value\\": \\"0.75rem\\",
        \\"variable\\": \\"var(--spacing-3)\\"
      },
      \\"spacing.4\\": {
        \\"value\\": \\"1rem\\",
        \\"variable\\": \\"var(--spacing-4)\\"
      },
      \\"spacing.5\\": {
        \\"value\\": \\"1.25rem\\",
        \\"variable\\": \\"var(--spacing-5)\\"
      },
      \\"spacing.6\\": {
        \\"value\\": \\"1.5rem\\",
        \\"variable\\": \\"var(--spacing-6)\\"
      },
      \\"spacing.0.5\\": {
        \\"value\\": \\"0.125rem\\",
        \\"variable\\": \\"var(--spacing-0\\\\\\\\.5)\\"
      },
      \\"spacing.1.5\\": {
        \\"value\\": \\"0.375rem\\",
        \\"variable\\": \\"var(--spacing-1\\\\\\\\.5)\\"
      },
      \\"spacing.2.5\\": {
        \\"value\\": \\"0.625rem\\",
        \\"variable\\": \\"var(--spacing-2\\\\\\\\.5)\\"
      },
      \\"spacing.3.5\\": {
        \\"value\\": \\"0.875rem\\",
        \\"variable\\": \\"var(--spacing-3\\\\\\\\.5)\\"
      },
      \\"sizes.1\\": {
        \\"value\\": \\"0.25rem\\",
        \\"variable\\": \\"var(--sizes-1)\\"
      },
      \\"sizes.2\\": {
        \\"value\\": \\"0.5rem\\",
        \\"variable\\": \\"var(--sizes-2)\\"
      },
      \\"sizes.3\\": {
        \\"value\\": \\"0.75rem\\",
        \\"variable\\": \\"var(--sizes-3)\\"
      },
      \\"sizes.4\\": {
        \\"value\\": \\"1rem\\",
        \\"variable\\": \\"var(--sizes-4)\\"
      },
      \\"sizes.5\\": {
        \\"value\\": \\"1.25rem\\",
        \\"variable\\": \\"var(--sizes-5)\\"
      },
      \\"sizes.6\\": {
        \\"value\\": \\"1.5rem\\",
        \\"variable\\": \\"var(--sizes-6)\\"
      },
      \\"sizes.0.5\\": {
        \\"value\\": \\"0.125rem\\",
        \\"variable\\": \\"var(--sizes-0\\\\\\\\.5)\\"
      },
      \\"sizes.1.5\\": {
        \\"value\\": \\"0.375rem\\",
        \\"variable\\": \\"var(--sizes-1\\\\\\\\.5)\\"
      },
      \\"sizes.2.5\\": {
        \\"value\\": \\"0.625rem\\",
        \\"variable\\": \\"var(--sizes-2\\\\\\\\.5)\\"
      },
      \\"sizes.3.5\\": {
        \\"value\\": \\"0.875rem\\",
        \\"variable\\": \\"var(--sizes-3\\\\\\\\.5)\\"
      },
      \\"sizes.xs\\": {
        \\"value\\": \\"20rem\\",
        \\"variable\\": \\"var(--sizes-xs)\\"
      },
      \\"sizes.sm\\": {
        \\"value\\": \\"24rem\\",
        \\"variable\\": \\"var(--sizes-sm)\\"
      },
      \\"sizes.md\\": {
        \\"value\\": \\"28rem\\",
        \\"variable\\": \\"var(--sizes-md)\\"
      },
      \\"sizes.lg\\": {
        \\"value\\": \\"32rem\\",
        \\"variable\\": \\"var(--sizes-lg)\\"
      },
      \\"sizes.xl\\": {
        \\"value\\": \\"36rem\\",
        \\"variable\\": \\"var(--sizes-xl)\\"
      },
      \\"sizes.breakpoint-sm\\": {
        \\"value\\": \\"30em\\",
        \\"variable\\": \\"var(--sizes-breakpoint-sm)\\"
      },
      \\"sizes.breakpoint-md\\": {
        \\"value\\": \\"48em\\",
        \\"variable\\": \\"var(--sizes-breakpoint-md)\\"
      },
      \\"sizes.breakpoint-lg\\": {
        \\"value\\": \\"62em\\",
        \\"variable\\": \\"var(--sizes-breakpoint-lg)\\"
      },
      \\"sizes.breakpoint-xl\\": {
        \\"value\\": \\"80em\\",
        \\"variable\\": \\"var(--sizes-breakpoint-xl)\\"
      },
      \\"sizes.breakpoint-2xl\\": {
        \\"value\\": \\"96em\\",
        \\"variable\\": \\"var(--sizes-breakpoint-2xl)\\"
      },
      \\"animations.none\\": {
        \\"value\\": \\"none\\",
        \\"variable\\": \\"var(--animations-none)\\"
      },
      \\"animations.spin\\": {
        \\"value\\": \\"spin 1s linear infinite\\",
        \\"variable\\": \\"var(--animations-spin)\\"
      },
      \\"animations.ping\\": {
        \\"value\\": \\"ping 1s cubic-bezier(0, 0, 0.2, 1) infinite\\",
        \\"variable\\": \\"var(--animations-ping)\\"
      },
      \\"animations.pulse\\": {
        \\"value\\": \\"pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite\\",
        \\"variable\\": \\"var(--animations-pulse)\\"
      },
      \\"animations.bounce\\": {
        \\"value\\": \\"bounce 1s infinite\\",
        \\"variable\\": \\"var(--animations-bounce)\\"
      },
      \\"easings.ease-in\\": {
        \\"value\\": \\"cubic-bezier(0.4, 0, 1, 1)\\",
        \\"variable\\": \\"var(--easings-ease-in)\\"
      },
      \\"easings.ease-out\\": {
        \\"value\\": \\"cubic-bezier(0, 0, 0.2, 1)\\",
        \\"variable\\": \\"var(--easings-ease-out)\\"
      },
      \\"easings.ease-in-out\\": {
        \\"value\\": \\"cubic-bezier(0.4, 0, 0.2, 1)\\",
        \\"variable\\": \\"var(--easings-ease-in-out)\\"
      },
      \\"durations.75\\": {
        \\"value\\": \\"75ms\\",
        \\"variable\\": \\"var(--durations-75)\\"
      },
      \\"durations.100\\": {
        \\"value\\": \\"100ms\\",
        \\"variable\\": \\"var(--durations-100)\\"
      },
      \\"durations.150\\": {
        \\"value\\": \\"150ms\\",
        \\"variable\\": \\"var(--durations-150)\\"
      },
      \\"breakpoints.sm\\": {
        \\"value\\": \\"30em\\",
        \\"variable\\": \\"var(--breakpoints-sm)\\"
      },
      \\"breakpoints.md\\": {
        \\"value\\": \\"48em\\",
        \\"variable\\": \\"var(--breakpoints-md)\\"
      },
      \\"breakpoints.lg\\": {
        \\"value\\": \\"62em\\",
        \\"variable\\": \\"var(--breakpoints-lg)\\"
      },
      \\"breakpoints.xl\\": {
        \\"value\\": \\"80em\\",
        \\"variable\\": \\"var(--breakpoints-xl)\\"
      },
      \\"breakpoints.2xl\\": {
        \\"value\\": \\"96em\\",
        \\"variable\\": \\"var(--breakpoints-2xl)\\"
      },
      \\"colors.primary\\": {
        \\"value\\": \\"var(--colors-primary)\\",
        \\"variable\\": \\"var(--colors-primary)\\"
      },
      \\"colors.secondary\\": {
        \\"value\\": \\"var(--colors-secondary)\\",
        \\"variable\\": \\"var(--colors-secondary)\\"
      },
      \\"colors.complex\\": {
        \\"value\\": \\"var(--colors-complex)\\",
        \\"variable\\": \\"var(--colors-complex)\\"
      },
      \\"colors.surface\\": {
        \\"value\\": \\"var(--colors-surface)\\",
        \\"variable\\": \\"var(--colors-surface)\\"
      },
      \\"colors.button.thick\\": {
        \\"value\\": \\"var(--colors-button-thick)\\",
        \\"variable\\": \\"var(--colors-button-thick)\\"
      },
      \\"colors.button.card.body\\": {
        \\"value\\": \\"var(--colors-button-card-body)\\",
        \\"variable\\": \\"var(--colors-button-card-body)\\"
      },
      \\"colors.button.card.heading\\": {
        \\"value\\": \\"var(--colors-button-card-heading)\\",
        \\"variable\\": \\"var(--colors-button-card-heading)\\"
      },
      \\"spacing.gutter\\": {
        \\"value\\": \\"var(--spacing-gutter)\\",
        \\"variable\\": \\"var(--spacing-gutter)\\"
      },
      \\"spacing.-1\\": {
        \\"value\\": \\"calc(var(--spacing-1) * -1)\\",
        \\"variable\\": \\"var(--spacing-1)\\"
      },
      \\"spacing.-2\\": {
        \\"value\\": \\"calc(var(--spacing-2) * -1)\\",
        \\"variable\\": \\"var(--spacing-2)\\"
      },
      \\"spacing.-3\\": {
        \\"value\\": \\"calc(var(--spacing-3) * -1)\\",
        \\"variable\\": \\"var(--spacing-3)\\"
      },
      \\"spacing.-4\\": {
        \\"value\\": \\"calc(var(--spacing-4) * -1)\\",
        \\"variable\\": \\"var(--spacing-4)\\"
      },
      \\"spacing.-5\\": {
        \\"value\\": \\"calc(var(--spacing-5) * -1)\\",
        \\"variable\\": \\"var(--spacing-5)\\"
      },
      \\"spacing.-6\\": {
        \\"value\\": \\"calc(var(--spacing-6) * -1)\\",
        \\"variable\\": \\"var(--spacing-6)\\"
      },
      \\"spacing.-0.5\\": {
        \\"value\\": \\"calc(var(--spacing-0\\\\\\\\.5) * -1)\\",
        \\"variable\\": \\"var(--spacing-0\\\\\\\\.5)\\"
      },
      \\"spacing.-1.5\\": {
        \\"value\\": \\"calc(var(--spacing-1\\\\\\\\.5) * -1)\\",
        \\"variable\\": \\"var(--spacing-1\\\\\\\\.5)\\"
      },
      \\"spacing.-2.5\\": {
        \\"value\\": \\"calc(var(--spacing-2\\\\\\\\.5) * -1)\\",
        \\"variable\\": \\"var(--spacing-2\\\\\\\\.5)\\"
      },
      \\"spacing.-3.5\\": {
        \\"value\\": \\"calc(var(--spacing-3\\\\\\\\.5) * -1)\\",
        \\"variable\\": \\"var(--spacing-3\\\\\\\\.5)\\"
      },
      \\"spacing.-gutter\\": {
        \\"value\\": \\"var(--spacing-gutter)\\",
        \\"variable\\": \\"var(--spacing-gutter)\\"
      },
      \\"colors.colorPalette.50\\": {
        \\"value\\": \\"var(--colors-color-palette-50)\\",
        \\"variable\\": \\"var(--colors-color-palette-50)\\"
      },
      \\"colors.colorPalette.100\\": {
        \\"value\\": \\"var(--colors-color-palette-100)\\",
        \\"variable\\": \\"var(--colors-color-palette-100)\\"
      },
      \\"colors.colorPalette.200\\": {
        \\"value\\": \\"var(--colors-color-palette-200)\\",
        \\"variable\\": \\"var(--colors-color-palette-200)\\"
      },
      \\"colors.colorPalette.300\\": {
        \\"value\\": \\"var(--colors-color-palette-300)\\",
        \\"variable\\": \\"var(--colors-color-palette-300)\\"
      },
      \\"colors.colorPalette.400\\": {
        \\"value\\": \\"var(--colors-color-palette-400)\\",
        \\"variable\\": \\"var(--colors-color-palette-400)\\"
      },
      \\"colors.colorPalette.500\\": {
        \\"value\\": \\"var(--colors-color-palette-500)\\",
        \\"variable\\": \\"var(--colors-color-palette-500)\\"
      },
      \\"colors.colorPalette.600\\": {
        \\"value\\": \\"var(--colors-color-palette-600)\\",
        \\"variable\\": \\"var(--colors-color-palette-600)\\"
      },
      \\"colors.colorPalette.700\\": {
        \\"value\\": \\"var(--colors-color-palette-700)\\",
        \\"variable\\": \\"var(--colors-color-palette-700)\\"
      },
      \\"colors.colorPalette.800\\": {
        \\"value\\": \\"var(--colors-color-palette-800)\\",
        \\"variable\\": \\"var(--colors-color-palette-800)\\"
      },
      \\"colors.colorPalette.900\\": {
        \\"value\\": \\"var(--colors-color-palette-900)\\",
        \\"variable\\": \\"var(--colors-color-palette-900)\\"
      },
      \\"colors.colorPalette.yam\\": {
        \\"value\\": \\"var(--colors-color-palette-yam)\\",
        \\"variable\\": \\"var(--colors-color-palette-yam)\\"
      },
      \\"colors.colorPalette.poller\\": {
        \\"value\\": \\"var(--colors-color-palette-poller)\\",
        \\"variable\\": \\"var(--colors-color-palette-poller)\\"
      },
      \\"colors.colorPalette.tall\\": {
        \\"value\\": \\"var(--colors-color-palette-tall)\\",
        \\"variable\\": \\"var(--colors-color-palette-tall)\\"
      },
      \\"colors.colorPalette.thick\\": {
        \\"value\\": \\"var(--colors-color-palette-thick)\\",
        \\"variable\\": \\"var(--colors-color-palette-thick)\\"
      },
      \\"colors.colorPalette.body\\": {
        \\"value\\": \\"var(--colors-color-palette-body)\\",
        \\"variable\\": \\"var(--colors-color-palette-body)\\"
      },
      \\"colors.colorPalette.heading\\": {
        \\"value\\": \\"var(--colors-color-palette-heading)\\",
        \\"variable\\": \\"var(--colors-color-palette-heading)\\"
      }
    }

    export function token(path, fallback) {
      return tokens[path]?.value || fallback
    }

    function tokenVar(path, fallback) {
      return tokens[path]?.variable || fallback
    }

    token.var = tokenVar"
  `,
  )
})
