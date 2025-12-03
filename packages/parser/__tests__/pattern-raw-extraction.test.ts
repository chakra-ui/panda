import { describe, expect, test } from 'vitest'
import { parseAndExtract } from './fixture'

describe('pattern.raw() extraction in selectors', () => {
  test('pattern.raw() spread at top level', () => {
    const code = `
      import { css } from "styled-system/css";
      import { stack } from "styled-system/patterns";
      
      const baseStack = stack.raw({ 
        direction: 'column',
        gap: '4'
      })
      
      const styles = css({
        ...baseStack,
        padding: '6'
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "direction": "column",
              "gap": "4",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {
              "direction": "column",
              "gap": "4",
              "padding": "6",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('pattern.raw() spread within hover selector', () => {
    const code = `
      import { css } from "styled-system/css";
      import { stack } from "styled-system/patterns";
      
      const hoverStack = stack.raw({ 
        direction: 'row',
        gap: '8'
      })
      
      const styles = css({
        padding: '4',
        '&:hover': {
          ...hoverStack,
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
              "direction": "row",
              "gap": "8",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {
              "&:hover": {
                "direction": "row",
                "gap": "8",
                "opacity": 0.8,
              },
              "padding": "4",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('pattern.raw() spread in _hover condition', () => {
    const code = `
      import { css } from "styled-system/css";
      import { flex } from "styled-system/patterns";
      
      const flexLayout = flex.raw({ 
        direction: 'row',
        justify: 'center',
        align: 'center'
      })
      
      const component = css({
        color: 'blue.500',
        _hover: {
          ...flexLayout,
          color: 'blue.600'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "align": "center",
              "direction": "row",
              "justify": "center",
            },
          ],
          "name": "flex",
          "type": "pattern",
        },
        {
          "data": [
            {
              "_hover": {
                "align": "center",
                "color": "blue.600",
                "direction": "row",
                "justify": "center",
              },
              "color": "blue.500",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('pattern.raw() in nested arbitrary selectors', () => {
    const code = `
      import { css } from "styled-system/css";
      import { center } from "styled-system/patterns";
      
      const centerLayout = center.raw({ 
        inline: true,
        p: '4'
      })
      
      const listStyles = css({
        listStyle: 'none',
        '& li': {
          display: 'block',
          '&:hover': {
            ...centerLayout,
            background: 'gray.50'
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
              "inline": true,
              "p": "4",
            },
          ],
          "name": "center",
          "type": "pattern",
        },
        {
          "data": [
            {
              "& li": {
                "&:hover": {
                  "background": "gray.50",
                  "inline": true,
                  "p": "4",
                },
                "display": "block",
              },
              "listStyle": "none",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('inline pattern.raw() within selector', () => {
    const code = `
      import { css } from "styled-system/css";
      import { stack } from "styled-system/patterns";
      
      const styles = css({
        padding: '4',
        '&:hover': {
          ...stack.raw({ direction: 'row', gap: '8' }),
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
              "&:hover": {
                "direction": "row",
                "gap": "8",
                "opacity": 0.8,
              },
              "padding": "4",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "direction": "row",
              "gap": "8",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
      ]
    `)
  })

  test('multiple inline pattern.raw() calls in nested selectors', () => {
    const code = `
      import { css } from "styled-system/css";
      import { stack, center, grid } from "styled-system/patterns";
      
      const styles = css({
        display: 'block',
        '& > div': {
          ...stack.raw({ direction: 'column', gap: '2' }),
          '&:hover': {
            ...center.raw({ inline: true }),
            background: 'gray.100'
          },
          '&:focus': {
            ...grid.raw({ columns: 2, gap: '4' }),
            outline: 'none'
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
              "& > div": {
                "&:focus": {
                  "columns": 2,
                  "gap": "4",
                  "outline": "none",
                },
                "&:hover": {
                  "background": "gray.100",
                  "inline": true,
                },
                "direction": "column",
                "gap": "2",
              },
              "display": "block",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "direction": "column",
              "gap": "2",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {
              "inline": true,
            },
          ],
          "name": "center",
          "type": "pattern",
        },
        {
          "data": [
            {
              "columns": 2,
              "gap": "4",
            },
          ],
          "name": "grid",
          "type": "pattern",
        },
      ]
    `)
  })

  test('pattern.raw() in cva recipe with selectors', () => {
    const code = `
      import { cva } from "styled-system/css";
      import { stack } from "styled-system/patterns";
      
      const stackLayout = stack.raw({
        direction: 'column',
        gap: '2'
      })
      
      const button = cva({
        base: {
          cursor: 'pointer',
          '&:hover': {
            ...stackLayout,
            opacity: 0.9
          }
        },
        variants: {
          size: {
            sm: {
              padding: '2',
              '&:focus': {
                ...stackLayout,
                outline: '2px solid blue'
              }
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
              "direction": "column",
              "gap": "2",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {
              "base": {
                "&:hover": {
                  "direction": "column",
                  "gap": "2",
                  "opacity": 0.9,
                },
                "cursor": "pointer",
              },
              "variants": {
                "size": {
                  "sm": {
                    "&:focus": {
                      "direction": "column",
                      "gap": "2",
                      "outline": "2px solid blue",
                    },
                    "padding": "2",
                  },
                },
              },
            },
          ],
          "name": "cva",
          "type": "cva",
        },
      ]
    `)
  })

  test('pattern.raw() in sva with complex selectors', () => {
    const code = `
      import { sva } from "styled-system/css";
      import { grid } from "styled-system/patterns";
      
      const gridLayout = grid.raw({
        columns: 3,
        gap: '4'
      })
      
      const card = sva({
        slots: ['root', 'content'],
        base: {
          root: {
            border: '1px solid',
            '&[data-selected]': {
              ...gridLayout,
              borderColor: 'blue.500'
            }
          },
          content: {
            padding: '4',
            '& > *:first-child': {
              ...gridLayout,
              marginTop: 0
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
              "columns": 3,
              "gap": "4",
            },
          ],
          "name": "grid",
          "type": "pattern",
        },
        {
          "data": [
            {
              "base": {
                "content": {
                  "& > *:first-child": {
                    "columns": 3,
                    "gap": "4",
                    "marginTop": 0,
                  },
                  "padding": "4",
                },
                "root": {
                  "&[data-selected]": {
                    "borderColor": "blue.500",
                    "columns": 3,
                    "gap": "4",
                  },
                  "border": "1px solid",
                },
              },
              "slots": [
                "root",
                "content",
              ],
            },
          ],
          "name": "sva",
          "type": "sva",
        },
      ]
    `)
  })

  test('pattern.raw() in cva inline', () => {
    const code = `
      import { cva } from "styled-system/css";
      import { flex } from "styled-system/patterns";
      
      const button = cva({
        base: {
          cursor: 'pointer',
          '&:disabled': {
            ...flex.raw({ direction: 'column', align: 'center' }),
            opacity: 0.5
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
              "base": {
                "&:disabled": {
                  "align": "center",
                  "direction": "column",
                  "opacity": 0.5,
                },
                "cursor": "pointer",
              },
            },
          ],
          "name": "cva",
          "type": "cva",
        },
        {
          "data": [
            {
              "align": "center",
              "direction": "column",
            },
          ],
          "name": "flex",
          "type": "pattern",
        },
      ]
    `)
  })

  test('css.raw() inline within pattern (reverse scenario)', () => {
    const code = `
      import { css } from "styled-system/css";
      import { stack } from "styled-system/patterns";
      
      const layout = stack({
        direction: 'column',
        '&:hover': {
          ...css.raw({ color: 'red', fontSize: '16px' }),
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
              "&:hover": {
                "color": "red",
                "fontSize": "16px",
                "opacity": 0.9,
              },
              "direction": "column",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {
              "color": "red",
              "fontSize": "16px",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('pattern function called inside another pattern', () => {
    const code = `
      import { flex, stack } from "styled-system/patterns";
      
      const layout = flex({
        direction: 'column',
        '&:hover': {
          ...stack.raw({ gap: '4', direction: 'row' }),
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
              "&:hover": {
                "direction": "row",
                "gap": "4",
                "opacity": 0.9,
              },
              "direction": "column",
            },
          ],
          "name": "flex",
          "type": "pattern",
        },
        {
          "data": [
            {
              "direction": "row",
              "gap": "4",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
      ]
    `)
  })

  test('recipe with pattern.raw in compound variant', () => {
    const code = `
      import { cva } from "styled-system/css";
      import { center } from "styled-system/patterns";
      
      const button = cva({
        base: {
          cursor: 'pointer'
        },
        compoundVariants: [
          {
            size: 'lg',
            variant: 'primary',
            css: {
              ...center.raw({ inline: true }),
              padding: '8'
            }
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
              "base": {
                "cursor": "pointer",
              },
              "compoundVariants": [
                {
                  "css": {
                    "inline": true,
                    "padding": "8",
                  },
                  "size": "lg",
                  "variant": "primary",
                },
              ],
            },
          ],
          "name": "cva",
          "type": "cva",
        },
        {
          "data": [
            {
              "inline": true,
            },
          ],
          "name": "center",
          "type": "pattern",
        },
      ]
    `)
  })

  test('multiple pattern.raw spreads in same object', () => {
    const code = `
      import { css } from "styled-system/css";
      import { flex, center, stack } from "styled-system/patterns";
      
      const styles = css({
        '&:hover': {
          ...flex.raw({ direction: 'row' }),
          ...center.raw({ inline: true }),
          ...stack.raw({ gap: '4' }),
          color: 'red'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "&:hover": {
                "color": "red",
                "direction": "row",
                "gap": "4",
                "inline": true,
              },
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "direction": "row",
            },
          ],
          "name": "flex",
          "type": "pattern",
        },
        {
          "data": [
            {
              "inline": true,
            },
          ],
          "name": "center",
          "type": "pattern",
        },
        {
          "data": [
            {
              "gap": "4",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
      ]
    `)
  })

  test('comparing all scenarios: top-level vs selector vs inline', () => {
    const code = `
      import { css } from "styled-system/css";
      import { stack } from "styled-system/patterns";
      
      const stackRaw = stack.raw({ direction: 'row', gap: '4' })
      
      // Scenario 1: Works - spread at top level
      const worksAtTopLevel = css({
        ...stackRaw,
        padding: '6'
      })
      
      // Scenario 2: Works - spread within selector
      const worksInSelector = css({
        padding: '6',
        '&:hover': {
          ...stackRaw,
          opacity: 0.8
        }
      })
      
      // Scenario 3: Works - inline in selector
      const inlineInSelector = css({
        padding: '6',
        '&:hover': {
          ...stack.raw({ direction: 'column', gap: '8' }),
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
              "direction": "row",
              "gap": "4",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {
              "direction": "column",
              "gap": "8",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {
              "direction": "row",
              "gap": "4",
              "padding": "6",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "&:hover": {
                "direction": "row",
                "gap": "4",
                "opacity": 0.8,
              },
              "padding": "6",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "&:hover": {
                "direction": "column",
                "gap": "8",
                "opacity": 0.8,
              },
              "padding": "6",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('pattern.raw with css.raw, cva, and sva in selectors', () => {
    const code = `
      import { css, cva, sva } from "styled-system/css";
      import { flex } from "styled-system/patterns";
      
      const flexRaw = flex.raw({ direction: 'row', justify: 'center' })
      
      // CSS.raw test
      const cssRawStyles = css.raw({
        padding: '4',
        '&:hover': {
          ...flexRaw,
          opacity: 0.9
        }
      })
      
      // CVA test
      const cvaStyles = cva({
        base: {
          cursor: 'pointer',
          '&:hover': {
            ...flexRaw,
            background: 'blue.100'
          }
        }
      })
      
      // SVA test  
      const svaStyles = sva({
        slots: ['root', 'content'],
        base: {
          root: {
            border: '1px solid',
            '&:focus': {
              ...flexRaw,
              outline: 'none'
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
              "direction": "row",
              "justify": "center",
            },
          ],
          "name": "flex",
          "type": "pattern",
        },
        {
          "data": [
            {
              "&:hover": {
                "direction": "row",
                "justify": "center",
                "opacity": 0.9,
              },
              "padding": "4",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "base": {
                "&:hover": {
                  "background": "blue.100",
                  "direction": "row",
                  "justify": "center",
                },
                "cursor": "pointer",
              },
            },
          ],
          "name": "cva",
          "type": "cva",
        },
        {
          "data": [
            {
              "base": {
                "root": {
                  "&:focus": {
                    "direction": "row",
                    "justify": "center",
                    "outline": "none",
                  },
                  "border": "1px solid",
                },
              },
              "slots": [
                "root",
                "content",
              ],
            },
          ],
          "name": "sva",
          "type": "sva",
        },
      ]
    `)
  })

  test('complex selectors with pattern.raw', () => {
    const code = `
      import { css } from "styled-system/css";
      import { center, grid } from "styled-system/patterns";
      
      const styles = css({
        listStyle: 'none',
        
        // Complex nested selectors
        '& > li': {
          ...center.raw({ inline: true }),
          
          '&:first-child': {
            ...grid.raw({ columns: 2, gap: '3' }),
            marginTop: 0
          },
          
          '&:hover:not(:disabled)': {
            ...center.raw({ inline: false }),
            background: 'gray.50'
          }
        },
        
        // Data attribute selector
        '[data-selected="true"]': {
          ...grid.raw({ columns: 4 }),
          fontWeight: 'bold'
        },
        
        // Class selector
        '.active': {
          ...center.raw({ p: '4' }),
          color: 'blue.500'
        }
      })
    `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "& > li": {
                "&:first-child": {
                  "columns": 2,
                  "gap": "3",
                  "marginTop": 0,
                },
                "&:hover:not(:disabled)": {
                  "background": "gray.50",
                  "inline": false,
                },
                "inline": true,
              },
              ".active": {
                "color": "blue.500",
                "p": "4",
              },
              "[data-selected="true"]": {
                "columns": 4,
                "fontWeight": "bold",
              },
              "listStyle": "none",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "inline": true,
            },
          ],
          "name": "center",
          "type": "pattern",
        },
        {
          "data": [
            {
              "inline": false,
            },
          ],
          "name": "center",
          "type": "pattern",
        },
        {
          "data": [
            {
              "p": "4",
            },
          ],
          "name": "center",
          "type": "pattern",
        },
        {
          "data": [
            {
              "columns": 2,
              "gap": "3",
            },
          ],
          "name": "grid",
          "type": "pattern",
        },
        {
          "data": [
            {
              "columns": 4,
            },
          ],
          "name": "grid",
          "type": "pattern",
        },
      ]
    `)
  })
})
