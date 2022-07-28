import * as v from 'vitest';
import { getColorsMap, getTokenMap } from '../src/token-map';
import { tokens } from '@css-panda/fixture';

v.describe('Token types', () => {
  v.test('colors', () => {
    v.expect(getColorsMap(tokens.colors)).toMatchInlineSnapshot(`
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
      }
    `);
  });

  v.test('tokens', () => {
    v.expect(getTokenMap(tokens.fontWeights)).toMatchInlineSnapshot(
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

  v.test('spacing', () => {
    v.expect(getTokenMap(tokens.spacing)).toMatchInlineSnapshot(`
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
