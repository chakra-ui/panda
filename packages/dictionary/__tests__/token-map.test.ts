import { semanticTokens, tokens } from '@css-panda/fixture';
import { describe, expect, test } from 'vitest';
import { getSemanticTokenMap, getTokenMap } from '../src/token-map';

describe('Token types', () => {
  test('colors', () => {
    expect(getTokenMap(tokens.colors, { maxDepth: 3 })).toMatchInlineSnapshot(`
      Map {
        "current" => "currentColor",
        "gray.50" => "#FAFAFA",
        "gray.100" => "#F5F5F5",
        "gray.200" => "#E5E5E5",
        "gray.300" => "#D4D4D4",
        "gray.400" => "#A3A3A3",
        "gray.500" => "#737373",
        "gray.600" => "#525252",
        "gray.700" => "#333333",
        "gray.800" => "#121212",
        "gray.900" => "#0A0A0A",
        "green.50" => "#F0FFF4",
        "green.100" => "#C6F6D5",
        "green.200" => "#9AE6B4",
        "green.300" => "#68D391",
        "green.400" => "#48BB78",
        "green.500" => "#38A169",
        "green.600" => "#2F855A",
        "green.700" => "#276749",
        "green.800" => "#22543D",
        "green.900" => "#1C4532",
        "red.50" => "#FEF2F2",
        "red.100" => "#FEE2E2",
        "red.200" => "#FECACA",
        "red.300" => "#FCA5A5",
        "red.400" => "#F87171",
        "red.500" => "#EF4444",
        "red.600" => "#DC2626",
        "red.700" => "#B91C1C",
        "red.800" => "#991B1B",
        "red.900" => "#7F1D1D",
      }
    `);
  });

  test('tokens', () => {
    expect(getTokenMap(tokens.fontWeights)).toMatchInlineSnapshot(
      `
      Map {
        "normal" => 400,
        "medium" => 500,
        "semibold" => 600,
        "bold" => 700,
      }
    `
    );
  });

  test('spacing', () => {
    expect(getTokenMap(tokens.spacing)).toMatchInlineSnapshot(`
        Map {
          "1" => "0.25rem",
          "2" => "0.5rem",
          "3" => "0.75rem",
          "4" => "1rem",
          "5" => "1.25rem",
          "6" => "1.5rem",
          "0.5" => "0.125rem",
          "1.5" => "0.375rem",
          "2.5" => "0.625rem",
          "3.5" => "0.875rem",
        }
      `);
  });
});

describe('semantic tokens', () => {
  test('colors', () => {
    expect(getSemanticTokenMap(semanticTokens.colors)).toMatchInlineSnapshot(`
      Map {
        "raw" => Map {
          "primary" => "$red.500",
          "secondary" => "$red.800",
        },
        "dark" => Map {
          "primary" => "$red.400",
          "secondary" => "$red.700",
        },
      }
    `);
  });

  test('spacing', () => {
    expect(getSemanticTokenMap(semanticTokens.spacing)).toMatchInlineSnapshot(`
        Map {
          "raw" => Map {
            "gutter" => "$4",
          },
          "lg" => Map {
            "gutter" => "$5",
          },
          "dark" => Map {
            "gutter" => "40px",
          },
        }
      `);
  });
});
