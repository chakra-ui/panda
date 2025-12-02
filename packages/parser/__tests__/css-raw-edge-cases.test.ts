import { describe, expect, test } from 'vitest'
import { parseAndExtract } from './fixture'

describe('css.raw edge cases with spreading', () => {
  test('handles computed property names with spread', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        color: 'red',
        fontSize: '14px'
      })
      
      const dynamicKey = '_hover'
      
      const component = css({
        ...baseStyles,
        [dynamicKey]: {
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

  test('handles deeply nested conditions', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        padding: '10px'
      })
      
      const component = css({
        ...baseStyles,
        _hover: {
          ...baseStyles,
          "&:focus": {
            ...baseStyles,
            outline: '2px solid blue'
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
              "padding": "10px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_hover": {
                "&:focus": {
                  "outline": "2px solid blue",
                  "padding": "10px",
                },
                "padding": "10px",
              },
              "padding": "10px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles conditional spreading', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        color: 'blue',
        padding: '8px'
      })
      
      const isActive = true
      
      const component = css({
        ...(isActive ? baseStyles : {}),
        _hover: {
          ...(isActive && baseStyles),
          opacity: 0.9
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue",
              "padding": "8px",
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
                "opacity": 0.9,
                "padding": "8px",
              },
              "color": "blue",
              "padding": "8px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles spreading with array syntax', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        color: 'green',
        fontSize: '16px'
      })
      
      const component = css({
        ...baseStyles,
        _hover: [
          {
            ...baseStyles,
            opacity: 0.8
          }
        ]
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "green",
              "fontSize": "16px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_hover": [
                {
                  "color": "green",
                  "fontSize": "16px",
                  "opacity": 0.8,
                },
              ],
              "color": "green",
              "fontSize": "16px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles function return with spread', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        display: 'flex',
        gap: '10px'
      })
      
      const getStyles = () => ({
        ...baseStyles,
        padding: '20px'
      })
      
      const component = css({
        ...getStyles(),
        _hover: {
          ...baseStyles,
          background: 'gray.100'
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
              "_hover": {
                "background": "gray.100",
                "display": "flex",
                "gap": "10px",
              },
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles spreading with renamed imports', () => {
    const code = `
      import { css as pandaCss } from "styled-system/css";
      
      const baseStyles = pandaCss.raw({
        color: 'purple',
        fontWeight: 'bold'
      })
      
      const component = pandaCss({
        ...baseStyles,
        _active: {
          ...baseStyles,
          transform: 'scale(0.98)'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "purple",
              "fontWeight": "bold",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_active": {
                "color": "purple",
                "fontWeight": "bold",
                "transform": "scale(0.98)",
              },
              "color": "purple",
              "fontWeight": "bold",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles spreading undefined or null gracefully', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = undefined
      const nullStyles = null
      
      const validStyles = css.raw({
        color: 'orange',
        fontSize: '18px'
      })
      
      const component = css({
        ...baseStyles,
        ...nullStyles,
        ...validStyles,
        _hover: {
          ...validStyles,
          opacity: 0.7
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "orange",
              "fontSize": "18px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_hover": {
                "color": "orange",
                "fontSize": "18px",
                "opacity": 0.7,
              },
              "color": "orange",
              "fontSize": "18px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles css.raw spread inside another css.raw', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      })
      
      const resetStyles = css.raw({
        ...baseStyles,
        fontFamily: 'inherit',
        fontSize: 'inherit'
      })
      
      const buttonStyles = css.raw({
        ...resetStyles,
        cursor: 'pointer',
        border: 'none',
        borderRadius: '4px'
      })
      
      const component = css({
        ...buttonStyles,
        backgroundColor: 'blue.500',
        color: 'white',
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
              "boxSizing": "border-box",
              "fontFamily": "inherit",
              "fontSize": "inherit",
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
              "border": "none",
              "borderRadius": "4px",
              "boxSizing": "border-box",
              "cursor": "pointer",
              "fontFamily": "inherit",
              "fontSize": "inherit",
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
              "_hover": {
                "backgroundColor": "blue.600",
                "border": "none",
                "borderRadius": "4px",
                "boxSizing": "border-box",
                "cursor": "pointer",
                "fontFamily": "inherit",
                "fontSize": "inherit",
                "margin": 0,
                "padding": 0,
              },
              "backgroundColor": "blue.500",
              "border": "none",
              "borderRadius": "4px",
              "boxSizing": "border-box",
              "color": "white",
              "cursor": "pointer",
              "fontFamily": "inherit",
              "fontSize": "inherit",
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

  test('handles deeply chained css.raw spreads', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const level1 = css.raw({
        fontFamily: 'system-ui',
        lineHeight: 1.5
      })
      
      const level2 = css.raw({
        ...level1,
        fontSize: '16px',
        color: 'gray.900'
      })
      
      const level3 = css.raw({
        ...level2,
        padding: '12px',
        border: '1px solid'
      })
      
      const level4 = css.raw({
        ...level3,
        borderRadius: '8px',
        boxShadow: 'sm'
      })
      
      const component = css({
        ...level4,
        backgroundColor: 'white',
        _hover: {
          ...level2,  // Using earlier level
          backgroundColor: 'gray.50'
        },
        _focus: {
          ...level4,  // Using latest level
          borderColor: 'blue.500'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "fontFamily": "system-ui",
              "lineHeight": 1.5,
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "color": "gray.900",
              "fontFamily": "system-ui",
              "fontSize": "16px",
              "lineHeight": 1.5,
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "border": "1px solid",
              "color": "gray.900",
              "fontFamily": "system-ui",
              "fontSize": "16px",
              "lineHeight": 1.5,
              "padding": "12px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "border": "1px solid",
              "borderRadius": "8px",
              "boxShadow": "sm",
              "color": "gray.900",
              "fontFamily": "system-ui",
              "fontSize": "16px",
              "lineHeight": 1.5,
              "padding": "12px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_focus": {
                "border": "1px solid",
                "borderColor": "blue.500",
                "borderRadius": "8px",
                "boxShadow": "sm",
                "color": "gray.900",
                "fontFamily": "system-ui",
                "fontSize": "16px",
                "lineHeight": 1.5,
                "padding": "12px",
              },
              "_hover": {
                "backgroundColor": "gray.50",
                "color": "gray.900",
                "fontFamily": "system-ui",
                "fontSize": "16px",
                "lineHeight": 1.5,
              },
              "backgroundColor": "white",
              "border": "1px solid",
              "borderRadius": "8px",
              "boxShadow": "sm",
              "color": "gray.900",
              "fontFamily": "system-ui",
              "fontSize": "16px",
              "lineHeight": 1.5,
              "padding": "12px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles spreading with multiple css.raw calls in same object', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        color: 'red',
        padding: '10px'
      })
      
      const extraStyles = css.raw({
        margin: '5px',
        border: '1px solid black'
      })
      
      const component = css({
        ...baseStyles,
        ...extraStyles,
        _hover: {
          ...baseStyles,
          ...extraStyles,
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
              "padding": "10px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "border": "1px solid black",
              "margin": "5px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_hover": {
                "border": "1px solid black",
                "color": "red",
                "margin": "5px",
                "opacity": 0.8,
                "padding": "10px",
              },
              "border": "1px solid black",
              "color": "red",
              "margin": "5px",
              "padding": "10px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles css.raw in child selectors (Issue #1370)', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const paragraphSpacingStyles = css.raw({
        marginTop: '1rem',
        lineHeight: 1.6,
        color: 'gray.800'
      })
      
      const headingStyles = css.raw({
        fontWeight: 'bold',
        color: 'gray.900',
        marginBottom: '0.5rem'
      })
      
      export const proseCss = css({
        fontFamily: 'system-ui',
        "& p": {
          ...paragraphSpacingStyles,
          fontSize: '1rem'
        },
        "& h2": {
          ...headingStyles,
          fontSize: '1.5rem'
        },
        "& blockquote": {
          ...paragraphSpacingStyles,
          fontStyle: 'italic',
          borderLeft: '4px solid',
          paddingLeft: '1rem'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "gray.800",
              "lineHeight": 1.6,
              "marginTop": "1rem",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "color": "gray.900",
              "fontWeight": "bold",
              "marginBottom": "0.5rem",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "& blockquote": {
                "borderLeft": "4px solid",
                "color": "gray.800",
                "fontStyle": "italic",
                "lineHeight": 1.6,
                "marginTop": "1rem",
                "paddingLeft": "1rem",
              },
              "& h2": {
                "color": "gray.900",
                "fontSize": "1.5rem",
                "fontWeight": "bold",
                "marginBottom": "0.5rem",
              },
              "& p": {
                "color": "gray.800",
                "fontSize": "1rem",
                "lineHeight": 1.6,
                "marginTop": "1rem",
              },
              "fontFamily": "system-ui",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles nested selectors with css.raw references', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const linkStyles = css.raw({
        textDecoration: 'none',
        color: 'blue.600',
        transition: 'color 0.2s'
      })
      
      const buttonStyles = css.raw({
        padding: '0.5rem 1rem',
        borderRadius: '0.25rem',
        border: 'none',
        cursor: 'pointer'
      })
      
      const containerCss = css({
        "& .nav": {
          display: 'flex',
          gap: '1rem',
          "& a": {
            ...linkStyles,
            _hover: {
              ...linkStyles,
              color: 'blue.800'
            }
          },
          "& button": {
            ...buttonStyles,
            backgroundColor: 'blue.500',
            color: 'white',
            _hover: {
              ...buttonStyles,
              backgroundColor: 'blue.600'
            }
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
              "color": "blue.600",
              "textDecoration": "none",
              "transition": "color 0.2s",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "border": "none",
              "borderRadius": "0.25rem",
              "cursor": "pointer",
              "padding": "0.5rem 1rem",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "& .nav": {
                "& a": {
                  "_hover": {
                    "color": "blue.800",
                    "textDecoration": "none",
                    "transition": "color 0.2s",
                  },
                  "color": "blue.600",
                  "textDecoration": "none",
                  "transition": "color 0.2s",
                },
                "& button": {
                  "_hover": {
                    "backgroundColor": "blue.600",
                    "border": "none",
                    "borderRadius": "0.25rem",
                    "cursor": "pointer",
                    "padding": "0.5rem 1rem",
                  },
                  "backgroundColor": "blue.500",
                  "border": "none",
                  "borderRadius": "0.25rem",
                  "color": "white",
                  "cursor": "pointer",
                  "padding": "0.5rem 1rem",
                },
                "display": "flex",
                "gap": "1rem",
              },
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })
})

describe('css.raw conditional spreading edge cases', () => {
  test('handles ternary operator with css.raw', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const primaryStyles = css.raw({
        backgroundColor: 'blue.500',
        color: 'white'
      })
      
      const secondaryStyles = css.raw({
        backgroundColor: 'gray.200',
        color: 'gray.800'
      })
      
      const isEnabled = true
      const variant = 'primary'
      
      const button = css({
        padding: '0.5rem 1rem',
        borderRadius: '0.25rem',
        ...(variant === 'primary' ? primaryStyles : secondaryStyles),
        ...(isEnabled ? {} : { opacity: 0.5 }),
        _hover: {
          ...(variant === 'primary' ? primaryStyles : {}),
          opacity: 0.9
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "backgroundColor": "blue.500",
              "color": "white",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "backgroundColor": "gray.200",
              "color": "gray.800",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_hover": {
                "backgroundColor": "blue.500",
                "color": "white",
                "opacity": 0.9,
              },
              "backgroundColor": "blue.500",
              "borderRadius": "0.25rem",
              "color": "white",
              "padding": "0.5rem 1rem",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles logical AND spreading with css.raw', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const errorStyles = css.raw({
        borderColor: 'red.500',
        color: 'red.700',
        backgroundColor: 'red.50'
      })
      
      const focusStyles = css.raw({
        outline: '2px solid',
        outlineColor: 'blue.500',
        outlineOffset: '2px'
      })
      
      const hasError = false
      const isFocused = true
      
      const input = css({
        border: '1px solid',
        borderColor: 'gray.300',
        padding: '0.5rem',
        borderRadius: '0.25rem',
        ...(hasError && errorStyles),
        ...(isFocused && focusStyles),
        _focus: {
          ...(hasError && errorStyles),
          borderColor: 'blue.500'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "backgroundColor": "red.50",
              "borderColor": "red.500",
              "color": "red.700",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "outline": "2px solid",
              "outlineColor": "blue.500",
              "outlineOffset": "2px",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_focus": {
                "borderColor": "blue.500",
              },
              "border": "1px solid",
              "borderColor": "gray.300",
              "borderRadius": "0.25rem",
              "outline": "2px solid",
              "outlineColor": "blue.500",
              "outlineOffset": "2px",
              "padding": "0.5rem",
            },
            {
              "backgroundColor": "red.50",
              "borderColor": "red.500",
              "color": "red.700",
            },
            {
              "_focus": {
                "backgroundColor": "red.50",
                "borderColor": "red.500",
                "color": "red.700",
              },
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })
})

describe('css.raw cross-file and runtime edge cases', () => {
  test('handles function returns with css.raw (limited static analysis)', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const baseStyles = css.raw({
        padding: '1rem',
        border: '1px solid gray'
      })
      
      const getThemeStyles = (theme) => {
        if (theme === 'dark') {
          return css.raw({
            backgroundColor: 'gray.800',
            color: 'white'
          })
        }
        return css.raw({
          backgroundColor: 'white',
          color: 'gray.800'
        })
      }
      
      const component = css({
        ...baseStyles,
        ...getThemeStyles('dark'),
        borderRadius: '0.5rem'
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "border": "1px solid gray",
              "padding": "1rem",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "backgroundColor": "gray.800",
              "color": "white",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "backgroundColor": "white",
              "color": "gray.800",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "border": "1px solid gray",
              "borderRadius": "0.5rem",
              "padding": "1rem",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles exported/imported css.raw simulation', () => {
    const code = `
      import { css } from "styled-system/css";
      
      // Simulate imported styles from another file
      const importedBaseStyles = css.raw({
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.5
      })
      
      const importedButtonStyles = css.raw({
        cursor: 'pointer',
        border: 'none',
        outline: 'none'
      })
      
      // Simulate local styles
      export const localTheme = css.raw({
        ...importedBaseStyles,
        fontSize: '16px',
        color: 'gray.900'
      })
      
      // Use both imported and local styles
      const component = css({
        ...localTheme,
        ...importedButtonStyles,
        padding: '12px 24px',
        borderRadius: '8px',
        backgroundColor: 'blue.500',
        color: 'white',
        _hover: {
          ...importedButtonStyles,
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
              "fontFamily": "Inter, sans-serif",
              "lineHeight": 1.5,
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "border": "none",
              "cursor": "pointer",
              "outline": "none",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "color": "gray.900",
              "fontFamily": "Inter, sans-serif",
              "fontSize": "16px",
              "lineHeight": 1.5,
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
                "border": "none",
                "cursor": "pointer",
                "outline": "none",
              },
              "backgroundColor": "blue.500",
              "border": "none",
              "borderRadius": "8px",
              "color": "white",
              "cursor": "pointer",
              "fontFamily": "Inter, sans-serif",
              "fontSize": "16px",
              "lineHeight": 1.5,
              "outline": "none",
              "padding": "12px 24px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles css.raw mixed with native CSS properties', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const animationBase = css.raw({
        transition: 'all 0.3s ease',
        transformOrigin: 'center'
      })
      
      const component = css({
        // Native CSS first
        display: 'block',
        position: 'relative',
        
        // Then spread css.raw
        ...animationBase,
        
        // Override and add more native CSS
        transform: 'scale(1)',
        opacity: 1,
        
        // Pseudo selectors with mixed styles
        _hover: {
          ...animationBase,
          transform: 'scale(1.05)',  // Override spread property
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'  // New property
        },
        
        // Media queries with spread
        sm: {
          display: 'flex',
          ...animationBase,
          transform: 'scale(0.95)'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "transformOrigin": "center",
              "transition": "all 0.3s ease",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_hover": {
                "boxShadow": "0 4px 8px rgba(0, 0, 0, 0.1)",
                "transform": "scale(1.05)",
                "transformOrigin": "center",
                "transition": "all 0.3s ease",
              },
              "display": "block",
              "opacity": 1,
              "position": "relative",
              "sm": {
                "display": "flex",
                "transform": "scale(0.95)",
                "transformOrigin": "center",
                "transition": "all 0.3s ease",
              },
              "transform": "scale(1)",
              "transformOrigin": "center",
              "transition": "all 0.3s ease",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('handles error scenarios and graceful degradation', () => {
    const code = `
      import { css } from "styled-system/css";
      
      const validStyles = css.raw({
        color: 'blue.500',
        fontSize: '16px'
      })
      
      const undefinedStyles = undefined
      const nullStyles = null
      const emptyObject = {}
      
      const component = css({
        // Valid spread
        ...validStyles,
        
        // These should be handled gracefully
        ...undefinedStyles,
        ...nullStyles,
        ...emptyObject,
        
        // Regular properties
        padding: '1rem',
        margin: '0.5rem',
        
        _hover: {
          ...validStyles,
          ...undefinedStyles,  // Should not break
          opacity: 0.8
        },
        
        // Complex scenario
        ...(true ? validStyles : undefinedStyles),
        ...(false ? nullStyles : {})
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.500",
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
                "color": "blue.500",
                "fontSize": "16px",
                "opacity": 0.8,
              },
              "color": "blue.500",
              "fontSize": "16px",
              "margin": "0.5rem",
              "padding": "1rem",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })
})
