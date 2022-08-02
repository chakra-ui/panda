import { describe, test, expect } from 'vitest';
import { transformSync } from '../src/transform';
import { cssPlugin } from '../src/plugins';

describe('ast parser', () => {
  test('should parse static property', () => {
    const code = `
        const baseStyle = css({
            color: 'red',
            fontSize: '12px',
        })

        const testStyle = css({
          bg: "red.300",
          margin: { xs: "0", lg:"40px" },
          padding: [12, 50]
        })
     `;

    const collect = {};

    transformSync(code, {
      file: 'ts',
      plugins: [cssPlugin(collect)],
    });

    expect(collect).toMatchInlineSnapshot(`
      {
        "bg": "red.300",
        "color": "red",
        "fontSize": "12px",
        "margin": {
          "lg": "40px",
          "xs": "0",
        },
        "padding": [
          12,
          50,
        ],
      }
    `);
  });
});
