import { Dictionary } from '@css-panda/dictionary';
import { describe, test, expect } from 'vitest';
import { generateDts } from '../src/dts';
import { semanticTokens, tokens } from '@css-panda/fixture';

describe('package gen', () => {
  test('should generate package', () => {
    const dict = new Dictionary({ tokens, semanticTokens });
    expect(generateDts(dict)).toMatchInlineSnapshot(`
      "export type Token = 
      \\"fonts.heading\\" | 
      \\"fonts.body\\" | 
      \\"fonts.mono\\" | 
      \\"colors.current\\" | 
      \\"colors.gray.50\\" | 
      \\"colors.gray.100\\" | 
      \\"colors.gray.200\\" | 
      \\"colors.gray.300\\" | 
      \\"colors.gray.400\\" | 
      \\"colors.gray.500\\" | 
      \\"colors.gray.600\\" | 
      \\"colors.gray.700\\" | 
      \\"colors.gray.800\\" | 
      \\"colors.gray.900\\" | 
      \\"colors.green.50\\" | 
      \\"colors.green.100\\" | 
      \\"colors.green.200\\" | 
      \\"colors.green.300\\" | 
      \\"colors.green.400\\" | 
      \\"colors.green.500\\" | 
      \\"colors.green.600\\" | 
      \\"colors.green.700\\" | 
      \\"colors.green.800\\" | 
      \\"colors.green.900\\" | 
      \\"colors.red.50\\" | 
      \\"colors.red.100\\" | 
      \\"colors.red.200\\" | 
      \\"colors.red.300\\" | 
      \\"colors.red.400\\" | 
      \\"colors.red.500\\" | 
      \\"colors.red.600\\" | 
      \\"colors.red.700\\" | 
      \\"colors.red.800\\" | 
      \\"colors.red.900\\" | 
      \\"fontSizes.sm\\" | 
      \\"fontSizes.xs\\" | 
      \\"fontSizes.md\\" | 
      \\"fontSizes.lg\\" | 
      \\"fontSizes.xl\\" | 
      \\"lineHeights.normal\\" | 
      \\"lineHeights.none\\" | 
      \\"lineHeights.shorter\\" | 
      \\"lineHeights.short\\" | 
      \\"lineHeights.base\\" | 
      \\"lineHeights.tall\\" | 
      \\"lineHeights.taller\\" | 
      \\"fontWeights.normal\\" | 
      \\"fontWeights.medium\\" | 
      \\"fontWeights.semibold\\" | 
      \\"fontWeights.bold\\" | 
      \\"letterSpacings.tighter\\" | 
      \\"letterSpacings.tight\\" | 
      \\"letterSpacings.normal\\" | 
      \\"letterSpacings.wide\\" | 
      \\"letterSpacings.wider\\" | 
      \\"letterSpacings.widest\\" | 
      \\"radii.none\\" | 
      \\"radii.sm\\" | 
      \\"radii.base\\" | 
      \\"radii.md\\" | 
      \\"radii.lg\\" | 
      \\"radii.xl\\" | 
      \\"radii.2xl\\" | 
      \\"radii.3xl\\" | 
      \\"radii.full\\" | 
      \\"shadows.xs\\" | 
      \\"shadows.sm\\" | 
      \\"shadows.base\\" | 
      \\"shadows.md\\" | 
      \\"spacing.1\\" | 
      \\"spacing.-1\\" | 
      \\"spacing.2\\" | 
      \\"spacing.-2\\" | 
      \\"spacing.3\\" | 
      \\"spacing.-3\\" | 
      \\"spacing.4\\" | 
      \\"spacing.-4\\" | 
      \\"spacing.5\\" | 
      \\"spacing.-5\\" | 
      \\"spacing.6\\" | 
      \\"spacing.-6\\" | 
      \\"spacing.0.5\\" | 
      \\"spacing.-0.5\\" | 
      \\"spacing.1.5\\" | 
      \\"spacing.-1.5\\" | 
      \\"spacing.2.5\\" | 
      \\"spacing.-2.5\\" | 
      \\"spacing.3.5\\" | 
      \\"spacing.-3.5\\" | 
      \\"sizes.1\\" | 
      \\"sizes.2\\" | 
      \\"sizes.3\\" | 
      \\"sizes.4\\" | 
      \\"sizes.5\\" | 
      \\"sizes.6\\" | 
      \\"sizes.0.5\\" | 
      \\"sizes.1.5\\" | 
      \\"sizes.2.5\\" | 
      \\"sizes.3.5\\" | 
      \\"largeSizes.xs\\" | 
      \\"largeSizes.sm\\" | 
      \\"largeSizes.md\\" | 
      \\"largeSizes.lg\\" | 
      \\"largeSizes.xl\\" | 
      \\"animations.none\\" | 
      \\"animations.spin\\" | 
      \\"animations.ping\\" | 
      \\"animations.pulse\\" | 
      \\"animations.bounce\\" | 
      \\"opacity.0\\" | 
      \\"opacity.25\\" | 
      \\"opacity.50\\" | 
      \\"opacity.75\\" | 
      \\"opacity.100\\" | 
      \\"easings.ease-in\\" | 
      \\"easings.ease-out\\" | 
      \\"durations.75\\" | 
      \\"durations.100\\" | 
      \\"durations.150\\" | 
      \\"transitionProperties.all\\" | 
      \\"transitionProperties.none\\" | 
      \\"transitionProperties.background\\" | 
      \\"transitionProperties.colors\\" | 
      \\"colors.primary\\" | 
      \\"colors.secondary\\" | 
      \\"spacing.gutter\\" | 
      \\"spacing.-gutter\\";"
    `);
  });
});
