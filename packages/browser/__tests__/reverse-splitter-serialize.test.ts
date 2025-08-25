import { describe, test, expect } from 'vitest'
import { reverseSplitter } from '../src/reverse-splitter'
import { serialize } from '../src/serialize'

describe('reverse-splitter + serialize round-trip', () => {
  test('should maintain consistency between reverse-splitter and serialize for basic numeric values', () => {
    // Start with a class list that represents some styles
    const classList = 'w_100 h_200 p_16 m_8 z_5 op_0.8 fs_14 lh_1.5 fw_600'

    // Use reverse-splitter to convert classes back to style object
    const styleObject = reverseSplitter(classList)

    // Verify the style object has the expected structure
    expect(styleObject).toMatchInlineSnapshot(`
      {
        "fontSize": 14,
        "fontWeight": 600,
        "height": 200,
        "lineHeight": 1.5,
        "margin": 8,
        "opacity": 0.8,
        "padding": 16,
        "width": 100,
        "zIndex": 5,
      }
    `)

    // Use serialize to convert the style object back to CSS classes
    const result = serialize(styleObject)

    // Verify the className matches the original classList
    expect(result.className).toBe(classList)

    // Verify the CSS output has proper pixel conversion
    expect(result.css).toMatchInlineSnapshot(`
      ".w_100 {
        width: 100px;
      }
      .h_200 {
        height: 200px;
      }
      .p_16 {
        padding: 16px;
      }
      .m_8 {
        margin: 8px;
      }
      .z_5 {
        z-index: 5;
      }
      .op_0.8 {
        opacity: 0.8;
      }
      .fs_14 {
        font-size: 14px;
      }
      .lh_1.5 {
        line-height: 1.5;
      }
      .fw_600 {
        font-weight: 600;
      }"
    `)
  })
})
