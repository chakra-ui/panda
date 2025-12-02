import { describe, expect, test } from 'vitest'
import { parseAndExtract } from './fixture'

describe('css.raw spreading in conditions', () => {
  test('spreads css.raw in pseudo selectors', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        color: 'red',
        fontSize: '14px'
      })
      
      const component = css({
        ...baseStyles,
        _hover: {
          ...baseStyles,
          opacity: 0.8
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
              "fontSize": "14px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_hover": {
                "color": "red",
                "fontSize": "14px",
                "opacity": 0.8,
              },
              "color": "red",
              "fontSize": "14px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('spreads css.raw in responsive conditions', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        padding: '10px',
        margin: '5px'
      })
      
      const responsive = css({
        sm: {
          ...baseStyles,
          width: '100%'
        },
        md: {
          ...baseStyles,
          width: '50%'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "margin": "5px",
              "padding": "10px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "md": {
                "margin": "5px",
                "padding": "10px",
                "width": "50%",
              },
              "sm": {
                "margin": "5px",
                "padding": "10px",
                "width": "100%",
              },
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles variable assignment with spread', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        color: 'blue',
        fontSize: '16px'
      })
      
      const hoveredBase = {
        ...baseStyles,
        opacity: 0.9
      }
      
      const component = css({
        ...baseStyles,
        _hover: hoveredBase
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue",
              "fontSize": "16px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_hover": {
                "color": "blue",
                "fontSize": "16px",
                "opacity": 0.9,
              },
              "color": "blue",
              "fontSize": "16px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles nested spreading with identifiers', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        display: 'flex',
        gap: '10px'
      })
      
      const hoverStyles = css.raw({
        background: 'gray.100',
        cursor: 'pointer'
      })
      
      const component = css({
        ...baseStyles,
        _hover: {
          ...hoverStyles,
          transform: 'scale(1.05)'
        },
        _focus: {
          ...baseStyles,
          outline: '2px solid blue'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "display": "flex",
              "gap": "10px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "background": "gray.100",
              "cursor": "pointer",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_focus": {
                "display": "flex",
                "gap": "10px",
                "outline": "2px solid blue",
              },
              "_hover": {
                "background": "gray.100",
                "cursor": "pointer",
                "transform": "scale(1.05)",
              },
              "display": "flex",
              "gap": "10px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles deeply nested spreading with conditions', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        color: 'text.primary',
        fontSize: 'md'
      })
      
      const interactiveStyles = css.raw({
        ...baseStyles,
        cursor: 'pointer',
        transition: 'all 0.2s'
      })
      
      const card = css({
        ...baseStyles,
        border: '1px solid',
        borderColor: 'border.default',
        _hover: {
          ...interactiveStyles,
          borderColor: 'border.hover',
          _dark: {
            ...interactiveStyles,
            borderColor: 'border.dark.hover'
          }
        },
        sm: {
          ...baseStyles,
          padding: '2',
          _hover: {
            ...interactiveStyles,
            padding: '3'
          }
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "text.primary",
              "fontSize": "md",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "color": "text.primary",
              "cursor": "pointer",
              "fontSize": "md",
              "transition": "all 0.2s",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_hover": {
                "_dark": {
                  "borderColor": "border.dark.hover",
                  "color": "text.primary",
                  "cursor": "pointer",
                  "fontSize": "md",
                  "transition": "all 0.2s",
                },
                "borderColor": "border.hover",
                "color": "text.primary",
                "cursor": "pointer",
                "fontSize": "md",
                "transition": "all 0.2s",
              },
              "border": "1px solid",
              "borderColor": "border.default",
              "color": "text.primary",
              "fontSize": "md",
              "sm": {
                "_hover": {
                  "color": "text.primary",
                  "cursor": "pointer",
                  "fontSize": "md",
                  "padding": "3",
                  "transition": "all 0.2s",
                },
                "color": "text.primary",
                "fontSize": "md",
                "padding": "2",
              },
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles spreading css.raw in arbitrary selectors', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const resetStyles = css.raw({
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      })
      
      const listStyles = css({
        ...resetStyles,
        listStyle: 'none',
        '& li': {
          ...resetStyles,
          display: 'block',
          '&:hover': {
            ...resetStyles,
            background: 'gray.50'
          }
        },
        '[data-selected]': {
          ...resetStyles,
          fontWeight: 'bold'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "boxSizing": "border-box",
              "margin": 0,
              "padding": 0,
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "& li": {
                "&:hover": {
                  "background": "gray.50",
                  "boxSizing": "border-box",
                  "margin": 0,
                  "padding": 0,
                },
                "boxSizing": "border-box",
                "display": "block",
                "margin": 0,
                "padding": 0,
              },
              "[data-selected]": {
                "boxSizing": "border-box",
                "fontWeight": "bold",
                "margin": 0,
                "padding": 0,
              },
              "boxSizing": "border-box",
              "listStyle": "none",
              "margin": 0,
              "padding": 0,
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles spreading across multiple files', () => {
    const code = `
      import { css } from "styled-system/css";
      
      // Simulate exported styles (in real code this would be imported)
      const sharedStyles = css.raw({
        fontFamily: 'sans-serif',
        lineHeight: 1.5
      })
      
      export const buttonStyles = css.raw({
        ...sharedStyles,
        padding: '8px 16px',
        borderRadius: '4px'
      })
      
      const button = css({
        ...buttonStyles,
        backgroundColor: 'blue.500',
        _hover: {
          ...buttonStyles,
          backgroundColor: 'blue.600'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "fontFamily": "sans-serif",
              "lineHeight": 1.5,
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "borderRadius": "4px",
              "fontFamily": "sans-serif",
              "lineHeight": 1.5,
              "padding": "8px 16px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_hover": {
                "backgroundColor": "blue.600",
                "borderRadius": "4px",
                "fontFamily": "sans-serif",
                "lineHeight": 1.5,
                "padding": "8px 16px",
              },
              "backgroundColor": "blue.500",
              "borderRadius": "4px",
              "fontFamily": "sans-serif",
              "lineHeight": 1.5,
              "padding": "8px 16px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })
})
