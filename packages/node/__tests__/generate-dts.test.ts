import { TokenDictionary } from '@css-panda/token-dictionary'
import { semanticTokens, tokens } from '@css-panda/fixture'
import { expect, test } from 'vitest'
import { generateTokenDts } from '../src/generators/token-dts'

test('[dts] should generate package', () => {
  const dict = new TokenDictionary({ tokens, semanticTokens })
  expect(generateTokenDts(dict)).toMatchInlineSnapshot(`
    "export type Token = \\"fonts.heading\\" | \\"fonts.body\\" | \\"fonts.mono\\" | \\"colors.current\\" | \\"colors.gray.50\\" | \\"colors.gray.100\\" | \\"colors.gray.200\\" | \\"colors.gray.300\\" | \\"colors.gray.400\\" | \\"colors.gray.500\\" | \\"colors.gray.600\\" | \\"colors.gray.700\\" | \\"colors.gray.800\\" | \\"colors.gray.900\\" | \\"colors.green.50\\" | \\"colors.green.100\\" | \\"colors.green.200\\" | \\"colors.green.300\\" | \\"colors.green.400\\" | \\"colors.green.500\\" | \\"colors.green.600\\" | \\"colors.green.700\\" | \\"colors.green.800\\" | \\"colors.green.900\\" | \\"colors.red.50\\" | \\"colors.red.100\\" | \\"colors.red.200\\" | \\"colors.red.300\\" | \\"colors.red.400\\" | \\"colors.red.500\\" | \\"colors.red.600\\" | \\"colors.red.700\\" | \\"colors.red.800\\" | \\"colors.red.900\\" | \\"fontSizes.sm\\" | \\"fontSizes.xs\\" | \\"fontSizes.md\\" | \\"fontSizes.lg\\" | \\"fontSizes.xl\\" | \\"lineHeights.normal\\" | \\"lineHeights.none\\" | \\"lineHeights.shorter\\" | \\"lineHeights.short\\" | \\"lineHeights.base\\" | \\"lineHeights.tall\\" | \\"lineHeights.taller\\" | \\"fontWeights.normal\\" | \\"fontWeights.medium\\" | \\"fontWeights.semibold\\" | \\"fontWeights.bold\\" | \\"letterSpacings.tighter\\" | \\"letterSpacings.tight\\" | \\"letterSpacings.normal\\" | \\"letterSpacings.wide\\" | \\"letterSpacings.wider\\" | \\"letterSpacings.widest\\" | \\"radii.none\\" | \\"radii.sm\\" | \\"radii.base\\" | \\"radii.md\\" | \\"radii.lg\\" | \\"radii.xl\\" | \\"radii.2xl\\" | \\"radii.3xl\\" | \\"radii.full\\" | \\"shadows.xs\\" | \\"shadows.sm\\" | \\"shadows.base\\" | \\"shadows.md\\" | \\"spacing.1\\" | \\"spacing.2\\" | \\"spacing.3\\" | \\"spacing.4\\" | \\"spacing.5\\" | \\"spacing.6\\" | \\"spacing.0.5\\" | \\"spacing.1.5\\" | \\"spacing.2.5\\" | \\"spacing.3.5\\" | \\"sizes.1\\" | \\"sizes.2\\" | \\"sizes.3\\" | \\"sizes.4\\" | \\"sizes.5\\" | \\"sizes.6\\" | \\"sizes.0.5\\" | \\"sizes.1.5\\" | \\"sizes.2.5\\" | \\"sizes.3.5\\" | \\"largeSizes.xs\\" | \\"largeSizes.sm\\" | \\"largeSizes.md\\" | \\"largeSizes.lg\\" | \\"largeSizes.xl\\" | \\"animations.none\\" | \\"animations.spin\\" | \\"animations.ping\\" | \\"animations.pulse\\" | \\"animations.bounce\\" | \\"easings.ease-in\\" | \\"easings.ease-out\\" | \\"easings.ease-in-out\\" | \\"durations.75\\" | \\"durations.100\\" | \\"durations.150\\" | \\"colors.primary\\" | \\"colors.secondary\\" | \\"spacing.gutter\\" | \\"spacing.-1\\" | \\"spacing.-2\\" | \\"spacing.-3\\" | \\"spacing.-4\\" | \\"spacing.-5\\" | \\"spacing.-6\\" | \\"spacing.-0.5\\" | \\"spacing.-1.5\\" | \\"spacing.-2.5\\" | \\"spacing.-3.5\\" | \\"spacing.-gutter\\" | \\"colors.palette.50\\" | \\"colors.palette.100\\" | \\"colors.palette.200\\" | \\"colors.palette.300\\" | \\"colors.palette.400\\" | \\"colors.palette.500\\" | \\"colors.palette.600\\" | \\"colors.palette.700\\" | \\"colors.palette.800\\" | \\"colors.palette.900\\"

    export type Font = \\"heading\\" | \\"body\\" | \\"mono\\"

    export type Palette = \\"gray\\" | \\"green\\" | \\"red\\"

    export type Color = \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"palette.50\\" | \\"palette.100\\" | \\"palette.200\\" | \\"palette.300\\" | \\"palette.400\\" | \\"palette.500\\" | \\"palette.600\\" | \\"palette.700\\" | \\"palette.800\\" | \\"palette.900\\"

    export type FontSize = \\"sm\\" | \\"xs\\" | \\"md\\" | \\"lg\\" | \\"xl\\"

    export type LineHeight = \\"normal\\" | \\"none\\" | \\"shorter\\" | \\"short\\" | \\"base\\" | \\"tall\\" | \\"taller\\"

    export type FontWeight = \\"normal\\" | \\"medium\\" | \\"semibold\\" | \\"bold\\"

    export type LetterSpacing = \\"tighter\\" | \\"tight\\" | \\"normal\\" | \\"wide\\" | \\"wider\\" | \\"widest\\"

    export type Radius = \\"none\\" | \\"sm\\" | \\"base\\" | \\"md\\" | \\"lg\\" | \\"xl\\" | \\"2xl\\" | \\"3xl\\" | \\"full\\"

    export type Shadow = \\"xs\\" | \\"sm\\" | \\"base\\" | \\"md\\"

    export type Spacing = \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\"

    export type Size = \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\"

    export type LargeSize = \\"xs\\" | \\"sm\\" | \\"md\\" | \\"lg\\" | \\"xl\\"

    export type Animation = \\"none\\" | \\"spin\\" | \\"ping\\" | \\"pulse\\" | \\"bounce\\"

    export type Easing = \\"ease-in\\" | \\"ease-out\\" | \\"ease-in-out\\"

    export type Duration = \\"75\\" | \\"100\\" | \\"150\\"

    export interface Tokens {
    		fonts: Font
    		colors: Color
    		fontSizes: FontSize
    		lineHeights: LineHeight
    		fontWeights: FontWeight
    		letterSpacings: LetterSpacing
    		radii: Radius
    		shadows: Shadow
    		spacing: Spacing
    		sizes: Size
    		largeSizes: LargeSize
    		animations: Animation
    		easings: Easing
    		durations: Duration
    }"
  `)
})
