import * as v from 'vitest';
import {
  getColorsMap,
  getFontSizeMap,
  getSpacingMap,
  getTokenMap,
} from '../src/token-map';
import { tokens } from '@css-panda/fixture';

v.describe('Token types', () => {
  v.test('font sizes', () => {
    v.expect(getFontSizeMap(tokens.fontSizes)).toMatchInlineSnapshot(`
      Map {
        "fontSizes.sm" => {
          "fontSize": "40rem",
        },
        "fontSizes.xs" => {
          "fontSize": "0.75rem",
          "lineHeight": "1rem",
        },
        "fontSizes.md" => {
          "fontSize": "0.875rem",
          "lineHeight": "1.25rem",
        },
      }
    `);
  });

  v.test('colors', () => {
    v.expect(getColorsMap(tokens.colors)).toMatchInlineSnapshot(`
      Map {
        "colors.current" => "currentColor",
        "colors.gray.50" => "#FAFAFA",
        "colors.gray.100" => "#F5F5F5",
        "colors.gray.200" => "#E5E5E5",
        "colors.gray.300" => "#D4D4D4",
        "colors.gray.400" => "#A3A3A3",
        "colors.gray.500" => "#737373",
        "colors.gray.600" => "#525252",
        "colors.gray.700" => "#333333",
        "colors.gray.800" => "#121212",
        "colors.gray.900" => "#0A0A0A",
        "colors.green.50" => "#F0FFF4",
        "colors.green.100" => "#C6F6D5",
        "colors.green.200" => "#9AE6B4",
        "colors.green.300" => "#68D391",
        "colors.green.400" => "#48BB78",
        "colors.green.500" => "#38A169",
        "colors.green.600" => "#2F855A",
        "colors.green.700" => "#276749",
        "colors.green.800" => "#22543D",
        "colors.green.900" => "#1C4532",
      }
    `);
  });

  v.test('tokens', () => {
    v.expect(
      getTokenMap('fontWeights', tokens.fontWeights)
    ).toMatchInlineSnapshot(
      `
      Map {
        "fontWeights.normal" => 400,
        "fontWeights.medium" => 500,
        "fontWeights.semibold" => 600,
        "fontWeights.bold" => 700,
      }
    `
    );
  });

  v.test('spacing', () => {
    v.expect(getSpacingMap(tokens.spacing)).toMatchInlineSnapshot(`
      Map {
        "spacing.1" => "0.25rem",
        "spacing.-1" => "-0.25rem",
        "spacing.2" => "0.5rem",
        "spacing.-2" => "-0.5rem",
        "spacing.3" => "0.75rem",
        "spacing.-3" => "-0.75rem",
        "spacing.4" => "1rem",
        "spacing.-4" => "-1rem",
        "spacing.5" => "1.25rem",
        "spacing.-5" => "-1.25rem",
        "spacing.6" => "1.5rem",
        "spacing.-6" => "-1.5rem",
        "spacing.0.5" => "0.125rem",
        "spacing.-0.5" => "-0.125rem",
        "spacing.1.5" => "0.375rem",
        "spacing.-1.5" => "-0.375rem",
        "spacing.2.5" => "0.625rem",
        "spacing.-2.5" => "-0.625rem",
        "spacing.3.5" => "0.875rem",
        "spacing.-3.5" => "-0.875rem",
      }
    `);
  });
});
