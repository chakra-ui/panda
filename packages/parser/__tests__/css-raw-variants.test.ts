import { describe, expect, test } from 'vitest'
import { parseAndExtract } from './fixture'

describe('css.raw spreading in variants', () => {
  test('spreads css.raw in cva base styles', () => {
    const code = `
      import { css, cva } from "styled-system/css";
      
      const baseStyles = css.raw({
        display: 'flex',
        alignItems: 'center',
        gap: '2'
      })
      
      const button = cva({
        base: {
          ...baseStyles,
          padding: '2',
          borderRadius: 'md'
        },
        variants: {
          size: {
            sm: { fontSize: 'sm' },
            lg: { fontSize: 'lg' }
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
              "alignItems": "center",
              "display": "flex",
              "gap": "2",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "base": {
                "alignItems": "center",
                "borderRadius": "md",
                "display": "flex",
                "gap": "2",
                "padding": "2",
              },
              "variants": {
                "size": {
                  "lg": {
                    "fontSize": "lg",
                  },
                  "sm": {
                    "fontSize": "sm",
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

  test('spreads css.raw in cva variant styles', () => {
    const code = `
      import { css, cva } from "styled-system/css";
      
      const hoverStyles = css.raw({
        opacity: 0.8,
        transform: 'scale(0.98)'
      })
      
      const interactiveStyles = css.raw({
        cursor: 'pointer',
        transition: 'all 0.2s'
      })
      
      const card = cva({
        base: {
          padding: '4',
          borderRadius: 'lg'
        },
        variants: {
          interactive: {
            true: {
              ...interactiveStyles,
              _hover: {
                ...hoverStyles,
                boxShadow: 'lg'
              }
            }
          },
          variant: {
            primary: {
              ...interactiveStyles,
              backgroundColor: 'blue.500'
            },
            secondary: {
              backgroundColor: 'gray.200'
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
              "opacity": 0.8,
              "transform": "scale(0.98)",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "cursor": "pointer",
              "transition": "all 0.2s",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "base": {
                "borderRadius": "lg",
                "padding": "4",
              },
              "variants": {
                "interactive": {
                  "true": {
                    "_hover": {
                      "boxShadow": "lg",
                      "opacity": 0.8,
                      "transform": "scale(0.98)",
                    },
                    "cursor": "pointer",
                    "transition": "all 0.2s",
                  },
                },
                "variant": {
                  "primary": {
                    "backgroundColor": "blue.500",
                    "cursor": "pointer",
                    "transition": "all 0.2s",
                  },
                  "secondary": {
                    "backgroundColor": "gray.200",
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

  test('spreads css.raw in sva slot styles', () => {
    const code = `
      import { css, sva } from "styled-system/css";
      
      const resetStyles = css.raw({
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      })
      
      const flexStyles = css.raw({
        display: 'flex',
        alignItems: 'center'
      })
      
      const modal = sva({
        slots: ['overlay', 'content', 'header', 'body'],
        base: {
          overlay: {
            ...resetStyles,
            position: 'fixed',
            inset: 0,
            backgroundColor: 'blackAlpha.600'
          },
          content: {
            ...resetStyles,
            backgroundColor: 'white',
            borderRadius: 'lg',
            boxShadow: 'xl'
          },
          header: {
            ...flexStyles,
            padding: '4',
            borderBottom: '1px solid',
            borderColor: 'gray.200'
          },
          body: {
            padding: '4'
          }
        },
        variants: {
          size: {
            sm: {
              content: { maxWidth: 'md' }
            },
            lg: {
              content: { maxWidth: '2xl' }
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
              "alignItems": "center",
              "display": "flex",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "base": {
                "body": {
                  "padding": "4",
                },
                "content": {
                  "backgroundColor": "white",
                  "borderRadius": "lg",
                  "boxShadow": "xl",
                  "boxSizing": "border-box",
                  "margin": 0,
                  "padding": 0,
                },
                "header": {
                  "alignItems": "center",
                  "borderBottom": "1px solid",
                  "borderColor": "gray.200",
                  "display": "flex",
                  "padding": "4",
                },
                "overlay": {
                  "backgroundColor": "blackAlpha.600",
                  "boxSizing": "border-box",
                  "inset": 0,
                  "margin": 0,
                  "padding": 0,
                  "position": "fixed",
                },
              },
              "slots": [
                "overlay",
                "content",
                "header",
                "body",
                "sm",
                "lg",
              ],
              "variants": {
                "size": {
                  "lg": {
                    "content": {
                      "maxWidth": "2xl",
                    },
                  },
                  "sm": {
                    "content": {
                      "maxWidth": "md",
                    },
                  },
                },
              },
            },
          ],
          "name": "sva",
          "type": "sva",
        },
      ]
    `)
  })

  test('spreads css.raw in sva variant slots with conditions', () => {
    const code = `
      import { css, sva } from "styled-system/css";
      
      const focusStyles = css.raw({
        outline: '2px solid',
        outlineColor: 'blue.500',
        outlineOffset: '2px'
      })
      
      const hoverStyles = css.raw({
        opacity: 0.9,
        transform: 'translateY(-1px)'
      })
      
      const button = sva({
        slots: ['root', 'icon', 'label'],
        base: {
          root: {
            cursor: 'pointer',
            borderRadius: 'md',
            _focus: {
              ...focusStyles
            },
            _hover: {
              ...hoverStyles
            }
          },
          icon: {
            width: '4',
            height: '4'
          },
          label: {
            fontWeight: 'medium'
          }
        },
        variants: {
          variant: {
            primary: {
              root: {
                backgroundColor: 'blue.500',
                color: 'white',
                _hover: {
                  ...hoverStyles,
                  backgroundColor: 'blue.600'
                }
              }
            },
            secondary: {
              root: {
                backgroundColor: 'gray.100',
                _focus: {
                  ...focusStyles,
                  outlineColor: 'gray.500'
                }
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
              "opacity": 0.9,
              "transform": "translateY(-1px)",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "base": {
                "icon": {
                  "height": "4",
                  "width": "4",
                },
                "label": {
                  "fontWeight": "medium",
                },
                "root": {
                  "_focus": {
                    "outline": "2px solid",
                    "outlineColor": "blue.500",
                    "outlineOffset": "2px",
                  },
                  "_hover": {
                    "opacity": 0.9,
                    "transform": "translateY(-1px)",
                  },
                  "borderRadius": "md",
                  "cursor": "pointer",
                },
              },
              "slots": [
                "root",
                "icon",
                "label",
                "primary",
                "secondary",
              ],
              "variants": {
                "variant": {
                  "primary": {
                    "root": {
                      "_hover": {
                        "backgroundColor": "blue.600",
                        "opacity": 0.9,
                        "transform": "translateY(-1px)",
                      },
                      "backgroundColor": "blue.500",
                      "color": "white",
                    },
                  },
                  "secondary": {
                    "root": {
                      "_focus": {
                        "outline": "2px solid",
                        "outlineColor": "gray.500",
                        "outlineOffset": "2px",
                      },
                      "backgroundColor": "gray.100",
                    },
                  },
                },
              },
            },
          ],
          "name": "sva",
          "type": "sva",
        },
      ]
    `)
  })

  test('handles complex nested css.raw spreading in cva compound variants', () => {
    const code = `
      import { css, cva } from "styled-system/css";
      
      const baseInputStyles = css.raw({
        border: '1px solid',
        borderRadius: 'md',
        padding: '2'
      })
      
      const errorStyles = css.raw({
        borderColor: 'red.500',
        color: 'red.700',
        _focus: {
          borderColor: 'red.600',
          boxShadow: '0 0 0 3px rgba(255, 0, 0, 0.1)'
        }
      })
      
      const input = cva({
        base: {
          ...baseInputStyles,
          outline: 'none'
        },
        variants: {
          size: {
            sm: { fontSize: 'sm' },
            md: { fontSize: 'md' },
            lg: { fontSize: 'lg' }
          },
          variant: {
            outline: { borderColor: 'gray.300' },
            filled: { 
              ...baseInputStyles,
              backgroundColor: 'gray.50'
            }
          },
          invalid: {
            true: {
              ...errorStyles
            }
          }
        },
        compoundVariants: [
          {
            variant: 'filled',
            invalid: true,
            css: {
              ...errorStyles,
              backgroundColor: 'red.50'
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
              "border": "1px solid",
              "borderRadius": "md",
              "padding": "2",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "_focus": {
                "borderColor": "red.600",
                "boxShadow": "0 0 0 3px rgba(255, 0, 0, 0.1)",
              },
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
              "base": {
                "border": "1px solid",
                "borderRadius": "md",
                "outline": "none",
                "padding": "2",
              },
              "compoundVariants": [
                {
                  "css": {
                    "_focus": {
                      "borderColor": "red.600",
                      "boxShadow": "0 0 0 3px rgba(255, 0, 0, 0.1)",
                    },
                    "backgroundColor": "red.50",
                    "borderColor": "red.500",
                    "color": "red.700",
                  },
                  "invalid": true,
                  "variant": "filled",
                },
              ],
              "variants": {
                "invalid": {
                  "true": {
                    "_focus": {
                      "borderColor": "red.600",
                      "boxShadow": "0 0 0 3px rgba(255, 0, 0, 0.1)",
                    },
                    "borderColor": "red.500",
                    "color": "red.700",
                  },
                },
                "size": {
                  "lg": {
                    "fontSize": "lg",
                  },
                  "md": {
                    "fontSize": "md",
                  },
                  "sm": {
                    "fontSize": "sm",
                  },
                },
                "variant": {
                  "filled": {
                    "backgroundColor": "gray.50",
                    "border": "1px solid",
                    "borderRadius": "md",
                    "padding": "2",
                  },
                  "outline": {
                    "borderColor": "gray.300",
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

  test('handles SVA slots array spreading (Issue #2671)', () => {
    const code = `
      import { css, sva } from "styled-system/css";
      
      const baseStyles = css.raw({
        margin: 0,
        padding: 0
      })
      
      // Simulate anatomy or array variable
      const slotNames = ['trigger', 'content', 'overlay']
      
      const drawer = sva({
        slots: [...slotNames],  // This was causing issues
        base: {
          trigger: {
            ...baseStyles,
            cursor: 'pointer',
            padding: '8px 16px'
          },
          content: {
            ...baseStyles,
            backgroundColor: 'white',
            border: '1px solid gray'
          },
          overlay: {
            ...baseStyles,
            position: 'fixed',
            inset: 0,
            backgroundColor: 'blackAlpha.600'
          }
        },
        variants: {
          size: {
            sm: {
              content: { width: '300px' }
            },
            lg: {
              content: { width: '500px' }
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
              "base": {
                "content": {
                  "backgroundColor": "white",
                  "border": "1px solid gray",
                  "margin": 0,
                  "padding": 0,
                },
                "overlay": {
                  "backgroundColor": "blackAlpha.600",
                  "inset": 0,
                  "margin": 0,
                  "padding": 0,
                  "position": "fixed",
                },
                "trigger": {
                  "cursor": "pointer",
                  "margin": 0,
                  "padding": "8px 16px",
                },
              },
              "slots": [
                "trigger",
                "content",
                "overlay",
                "sm",
                "lg",
              ],
              "variants": {
                "size": {
                  "lg": {
                    "content": {
                      "width": "500px",
                    },
                  },
                  "sm": {
                    "content": {
                      "width": "300px",
                    },
                  },
                },
              },
            },
          ],
          "name": "sva",
          "type": "sva",
        },
      ]
    `)
  })

  test('handles css.raw spreading in sva variant with conditional styles', () => {
    const code = `
      import { css, sva } from "styled-system/css";
      
      const animationStyles = css.raw({
        transition: 'all 0.3s ease',
        transform: 'translateX(-100%)'
      })
      
      const visibilityStyles = css.raw({
        opacity: 0,
        visibility: 'hidden'
      })
      
      const modal = sva({
        slots: ['backdrop', 'panel', 'header'],
        base: {
          backdrop: {
            position: 'fixed',
            inset: 0
          },
          panel: {
            ...animationStyles,
            position: 'relative'
          },
          header: {
            padding: '1rem'
          }
        },
        variants: {
          state: {
            open: {
              panel: {
                ...animationStyles,
                transform: 'translateX(0)',
                opacity: 1,
                visibility: 'visible'
              },
              backdrop: {
                opacity: 0.5
              }
            },
            closed: {
              panel: {
                ...animationStyles,
                ...visibilityStyles
              },
              backdrop: {
                ...visibilityStyles
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
              "transform": "translateX(-100%)",
              "transition": "all 0.3s ease",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "opacity": 0,
              "visibility": "hidden",
            },
          ],
          "name": "css",
          "type": "css",
        },
        {
          "data": [
            {
              "base": {
                "backdrop": {
                  "inset": 0,
                  "position": "fixed",
                },
                "header": {
                  "padding": "1rem",
                },
                "panel": {
                  "position": "relative",
                  "transform": "translateX(-100%)",
                  "transition": "all 0.3s ease",
                },
              },
              "slots": [
                "backdrop",
                "panel",
                "header",
                "open",
                "closed",
              ],
              "variants": {
                "state": {
                  "closed": {
                    "backdrop": {
                      "opacity": 0,
                      "visibility": "hidden",
                    },
                    "panel": {
                      "opacity": 0,
                      "transform": "translateX(-100%)",
                      "transition": "all 0.3s ease",
                      "visibility": "hidden",
                    },
                  },
                  "open": {
                    "backdrop": {
                      "opacity": 0.5,
                    },
                    "panel": {
                      "opacity": 1,
                      "transform": "translateX(0)",
                      "transition": "all 0.3s ease",
                      "visibility": "visible",
                    },
                  },
                },
              },
            },
          ],
          "name": "sva",
          "type": "sva",
        },
      ]
    `)
  })
})
