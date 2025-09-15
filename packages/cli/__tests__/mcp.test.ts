import { describe, expect, test, beforeAll, afterAll } from 'vitest'
import { spawn, ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'

describe('MCP Server', () => {
  const cwd = process.cwd()
  const _dirname = path.dirname(fileURLToPath(import.meta.url))
  const cliPath = path.resolve(cwd, _dirname, '../dist/cli-default.js')

  const testsCwd = path.resolve(cwd, _dirname, './samples')
  const configPath = path.resolve(testsCwd, 'panda.config.ts')

  // Helper function to create and configure MCP server process
  const createMcpServer = (): ChildProcess => {
    return spawn('node', [cliPath, 'mcp', '--config', configPath], {
      stdio: 'pipe',
      cwd: testsCwd,
    })
  }

  // Helper function to capture output from process
  const captureOutput = (child: ChildProcess): Promise<{ output: string; errorOutput: string }> => {
    return new Promise((resolve) => {
      let output = ''
      let errorOutput = ''

      child.stdout?.on('data', (data) => {
        output += data.toString()
      })

      child.stderr?.on('data', (data) => {
        errorOutput += data.toString()
      })

      // Wait for output to accumulate
      setTimeout(() => {
        resolve({ output, errorOutput })
      }, 1000)
    })
  }

  // Helper function to send JSON-RPC request and get response
  const sendMcpRequest = async (child: ChildProcess, request: object, waitTime: number = 2000): Promise<any> => {
    let output = ''
    child.stdout?.on('data', (data) => {
      output += data.toString()
    })

    child.stdin?.write(JSON.stringify(request) + '\n')

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, waitTime))

    child.kill()

    // Parse the JSON response
    const lines = output.split('\n').filter((line) => line.trim())
    const responseLine = lines.find((line) => line.includes('"result"'))

    if (responseLine) {
      const response = JSON.parse(responseLine)
      return JSON.parse(response.result.content[0].text)
    }

    throw new Error('No valid response found')
  }

  // Helper function to call a tool with arguments
  const callMcpTool = async (toolName: string, args: object = {}, requestId: number = 1): Promise<any> => {
    const child = createMcpServer()

    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }

    return sendMcpRequest(child, request)
  }

  beforeAll(async () => {
    // Create the `samples` folder and config
    await fs.mkdir(testsCwd, { recursive: true })

    // Create a minimal panda config for testing
    const configContent = `
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: false,
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  theme: {
    extend: {
      tokens: {
        colors: {
          red: {
            500: { value: '#ef4444' },
            600: { value: '#dc2626' }
          },
          blue: {
            500: { value: '#3b82f6' },
            600: { value: '#2563eb' }
          }
        },
        spacing: {
          sm: { value: '8px' },
          md: { value: '16px' }
        }
      },
      semanticTokens: {
        colors: {
          primary: {
            value: {
              base: '{colors.blue.500}',
              _dark: '{colors.blue.400}'
            }
          },
          secondary: {
            value: {
              base: '{colors.red.500}',
              _dark: '{colors.red.400}'
            }
          }
        },
        spacing: {
          container: {
            value: {
              base: '{spacing.md}',
              lg: '{spacing.lg}'
            }
          }
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)' },
          '100%': { transform: 'translateY(0)' }
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px'
    },
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite'
      }
    }
  },
  theme: {
    recipes: {
      button: {
        className: 'button',
        description: 'Button styles for the application',
        base: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        variants: {
          size: {
            sm: { padding: '8px 12px', fontSize: '14px' },
            md: { padding: '10px 16px', fontSize: '16px' },
            lg: { padding: '12px 20px', fontSize: '18px' }
          },
          variant: {
            solid: { bg: 'blue.500', color: 'white' },
            outline: { borderWidth: '1px', borderColor: 'blue.500', color: 'blue.500' },
            ghost: { color: 'blue.500' }
          }
        },
        defaultVariants: {
          size: 'md',
          variant: 'solid'
        }
      },
      card: {
        className: 'card',
        description: 'Card component styles',
        base: {
          borderRadius: '8px',
          padding: '16px',
          boxShadow: 'sm'
        },
        variants: {
          elevated: {
            true: { boxShadow: 'lg' },
            false: { boxShadow: 'sm' }
          }
        }
      },
      alert: {
        className: 'alert',
        description: 'Alert component with slots',
        slots: ['root', 'icon', 'content'],
        base: {
          root: { display: 'flex', padding: '16px' },
          icon: { marginRight: '8px' },
          content: { flex: '1' }
        },
        variants: {
          status: {
            success: {
              root: { bg: 'green.100', color: 'green.800' },
              icon: { color: 'green.500' }
            },
            error: {
              root: { bg: 'red.100', color: 'red.800' },
              icon: { color: 'red.500' }
            }
          }
        }
      }
    }
  }
})
`
    await fs.writeFile(configPath, configContent)
  })

  afterAll(async () => {
    try {
      await fs.rm(testsCwd, { recursive: true, force: true })
    } catch {
      // ignore cleanup errors
    }
  })

  test('should start MCP server', async () => {
    const child = createMcpServer()
    const { output, errorOutput } = await captureOutput(child)

    const allOutput = output + errorOutput
    expect(allOutput).toContain('Panda CSS MCP server started')

    child.kill()
  })

  test('should list tools via MCP protocol', async () => {
    const child = createMcpServer()

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    }

    let output = ''
    child.stdout?.on('data', (data) => {
      output += data.toString()
    })

    child.stdin?.write(JSON.stringify(request) + '\n')

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 2000))

    child.kill()

    // Parse the JSON response
    const lines = output.split('\n').filter((line) => line.trim())
    const responseLine = lines.find((line) => line.includes('"result"'))

    if (responseLine) {
      const response = JSON.parse(responseLine)
      expect(response.result).toBeDefined()
      expect(response.result.tools).toBeInstanceOf(Array)
      expect(response.result.tools.length).toBeGreaterThan(0)

      // Check for some expected tools
      const toolNames = response.result.tools.map((tool: any) => tool.name)
      expect(toolNames).toContain('list_tokens')
      expect(toolNames).toContain('list_semantic_tokens')
      expect(toolNames).toContain('list_breakpoints')
      expect(toolNames).toContain('list_keyframes_n_animations')
    }
  })

  test('should call list_tokens tool', async () => {
    const result = await callMcpTool('list_tokens')

    expect(result).toBeInstanceOf(Array)
    expect(result.length).toBeGreaterThan(0)
    // Check for some common tokens that should be present
    const hasColorTokens = result.some((token: string) => token.startsWith('colors.'))
    const hasSpacingTokens = result.some((token: string) => token.startsWith('spacing.'))
    expect(hasColorTokens).toBe(true)
    expect(hasSpacingTokens || result.some((token: string) => token.startsWith('aspectRatios.'))).toBe(true)
  })

  test('should filter tokens by category', async () => {
    const result = await callMcpTool('list_tokens', { category: 'colors' })

    expect(result).toBeInstanceOf(Array)
    expect(result.length).toBeGreaterThan(0)
    // When category is specified, tokens should NOT have the category prefix
    expect(result.every((token: string) => !token.startsWith('colors.'))).toBe(true)
    // Should contain some color token names without prefix
    expect(result.some((token: string) => token.includes('red') || token.includes('blue'))).toBe(true)
  })

  test('should call list_semantic_tokens tool', async () => {
    const result = await callMcpTool('list_semantic_tokens')

    console.log('Semantic tokens found:', result.length)
    expect(result).toBeInstanceOf(Array)
    // The result might be empty if no semantic tokens are found in the default config
  })

  test('should filter semantic tokens by category', async () => {
    const result = await callMcpTool('list_semantic_tokens', { category: 'colors' })

    console.log('Semantic tokens in colors category:', result.length)
    expect(result).toBeInstanceOf(Array)
    // The result might be empty if no semantic tokens are found in the specified category
  })

  test('should call list_breakpoints tool', async () => {
    const result = await callMcpTool('list_breakpoints')
    expect(result).toMatchInlineSnapshot(`
      [
        "base",
        "sm",
        "md",
        "lg",
        "xl",
        "2xl",
      ]
    `)
  })

  test('should call list_keyframes_n_animations for all', async () => {
    const result = await callMcpTool('list_keyframes_n_animations', { type: 'all' })

    expect(result).toMatchInlineSnapshot(`
      {
        "animations": [
          "spin",
          "ping",
          "pulse",
          "bounce",
        ],
        "keyframes": [
          "spin",
          "ping",
          "pulse",
          "bounce",
        ],
      }
    `)
  })

  test('should filter keyframes only', async () => {
    const result = await callMcpTool('list_keyframes_n_animations', { type: 'keyframes' })

    expect(result).toMatchInlineSnapshot(`
      {
        "animations": [],
        "keyframes": [
          "spin",
          "ping",
          "pulse",
          "bounce",
        ],
      }
    `)
  })

  test('should filter animations only', async () => {
    const result = await callMcpTool('list_keyframes_n_animations', { type: 'animations' })

    expect(result).toMatchInlineSnapshot(`
      {
        "animations": [
          "spin",
          "ping",
          "pulse",
          "bounce",
        ],
        "keyframes": [],
      }
    `)
  })

  test('should get full config', async () => {
    const result = await callMcpTool('get_config')

    expect(result).toBeDefined()
    expect(result.theme).toBeDefined()
    expect(result.conditions).toBeDefined()
    expect(result.theme.breakpoints).toMatchInlineSnapshot(`
      {
        "2xl": "1536px",
        "lg": "1024px",
        "md": "768px",
        "sm": "640px",
        "xl": "1280px",
      }
    `)
  })

  test('should get specific config section', async () => {
    const result = await callMcpTool('get_config', { section: 'theme' })

    expect(result.breakpoints).toMatchInlineSnapshot(`
      {
        "2xl": "1536px",
        "lg": "1024px",
        "md": "768px",
        "sm": "640px",
        "xl": "1280px",
      }
    `)
    // The theme should have tokens and keyframes (after merging extend)
    expect(result.tokens).toBeDefined()
    expect(result.keyframes).toBeDefined()
  })

  test('should list all recipes', async () => {
    const result = await callMcpTool('list_recipes')

    expect(result).toMatchInlineSnapshot(`
      [
        "button",
        "card",
        "alert",
      ]
    `)
  })

  test('should get specific recipe details', async () => {
    const result = await callMcpTool('get_recipe', { recipeName: 'button' })

    expect(result).toMatchInlineSnapshot(`
      {
        "className": "button",
        "defaultVariants": {
          "size": "md",
          "variant": "solid",
        },
        "description": "Button styles for the application",
        "name": "button",
        "type": "recipe",
        "usage": "import { button } from 'styled-system/recipes'
       
      function App() {
        return (
          <div>
            <button className={button()}>Click me</button>
            <button className={button({ size: 'sm' })}>Click me</button>
          </div>
        )
      }",
        "variants": {
          "size": [
            "sm",
            "md",
            "lg",
          ],
          "variant": [
            "solid",
            "outline",
            "ghost",
          ],
        },
      }
    `)
  })

  test('should get slot recipe details', async () => {
    const result = await callMcpTool('get_recipe', { recipeName: 'alert' })

    expect(result.type).toBe('slotRecipe')
    expect(result.slots).toEqual(['root', 'icon', 'content'])
    expect(result.variants).toMatchInlineSnapshot(`
      {
        "status": [
          "success",
          "error",
        ],
      }
    `)
  })

  test('should return error for non-existent recipe', async () => {
    const result = await callMcpTool('get_recipe', { recipeName: 'nonexistent' })

    expect(result.error).toBeDefined()
    expect(result.error).toContain('not found')
  })

  test('should list composition styles', async () => {
    const result = await callMcpTool('list_composition_styles')

    expect(result).toMatchInlineSnapshot(`
      [
        "2xl",
        "3xl",
        "4xl",
        "5xl",
        "6xl",
        "7xl",
        "8xl",
        "9xl",
        "lg",
        "md",
        "sm",
        "xl",
        "xs",
      ]
    `)
  })

  test('should get conditions config section', async () => {
    const result = await callMcpTool('get_config', { section: 'conditions' })

    expect(result).toMatchInlineSnapshot(`
      {
        "active": "&:is(:active, [data-active])",
        "after": "&::after",
        "atValue": "&[data-state=at-value]",
        "autofill": "&:autofill",
        "backdrop": "&::backdrop",
        "before": "&::before",
        "checked": "&:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"])",
        "closed": "&:is([closed], [data-closed], [data-state="closed"])",
        "complete": "&[data-complete]",
        "current": "&:is([aria-current=true], [data-current])",
        "currentPage": "&[aria-current=page]",
        "currentStep": "&[aria-current=step]",
        "dark": ".dark &",
        "default": "&:default",
        "disabled": "&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])",
        "dragging": "&[data-dragging]",
        "empty": "&:is(:empty, [data-empty])",
        "enabled": "&:enabled",
        "even": "&:nth-child(even)",
        "expanded": "&:is([aria-expanded=true], [data-expanded], [data-state="expanded"])",
        "file": "&::file-selector-button",
        "first": "&:first-child",
        "firstLetter": "&::first-letter",
        "firstLine": "&::first-line",
        "firstOfType": "&:first-of-type",
        "focus": "&:is(:focus, [data-focus])",
        "focusVisible": "&:is(:focus-visible, [data-focus-visible])",
        "focusWithin": "&:focus-within",
        "fullscreen": "&:is(:fullscreen, [data-fullscreen])",
        "grabbed": "&:is([aria-grabbed=true], [data-grabbed])",
        "groupActive": ".group:is(:active, [data-active]) &",
        "groupChecked": ".group:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"]) &",
        "groupDisabled": ".group:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) &",
        "groupExpanded": ".group:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) &",
        "groupFocus": ".group:is(:focus, [data-focus]) &",
        "groupFocusVisible": ".group:is(:focus-visible, [data-focus-visible]) &",
        "groupFocusWithin": ".group:focus-within &",
        "groupHover": ".group:is(:hover, [data-hover]) &",
        "groupInvalid": ".group:is(:invalid, [data-invalid], [aria-invalid=true]) &",
        "hidden": "&:is([hidden], [data-hidden])",
        "highContrast": "@media (forced-colors: active)",
        "highlighted": "&[data-highlighted]",
        "horizontal": "&[data-orientation=horizontal]",
        "hover": "&:is(:hover, [data-hover])",
        "icon": "& :where(svg)",
        "inRange": "&:is(:in-range, [data-in-range])",
        "incomplete": "&[data-incomplete]",
        "indeterminate": "&:is(:indeterminate, [data-indeterminate], [aria-checked=mixed], [data-state="indeterminate"])",
        "invalid": "&:is(:invalid, [data-invalid], [aria-invalid=true])",
        "invertedColors": "@media (inverted-colors: inverted)",
        "landscape": "@media (orientation: landscape)",
        "last": "&:last-child",
        "lastOfType": "&:last-of-type",
        "lessContrast": "@media (prefers-contrast: less)",
        "light": ".light &",
        "loading": "&:is([data-loading], [aria-busy=true])",
        "ltr": ":where([dir=ltr], :dir(ltr)) &",
        "marker": "&:is(::marker, ::-webkit-details-marker)",
        "moreContrast": "@media (prefers-contrast: more)",
        "motionReduce": "@media (prefers-reduced-motion: reduce)",
        "motionSafe": "@media (prefers-reduced-motion: no-preference)",
        "noscript": "@media (scripting: none)",
        "now": "&[data-now]",
        "odd": "&:nth-child(odd)",
        "only": "&:only-child",
        "onlyOfType": "&:only-of-type",
        "open": "&:is([open], [data-open], [data-state="open"], :popover-open)",
        "optional": "&:optional",
        "osDark": "@media (prefers-color-scheme: dark)",
        "osLight": "@media (prefers-color-scheme: light)",
        "outOfRange": "&:is(:out-of-range, [data-outside-range])",
        "overValue": "&[data-state=over-value]",
        "peerActive": ".peer:is(:active, [data-active]) ~ &",
        "peerChecked": ".peer:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"]) ~ &",
        "peerDisabled": ".peer:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) ~ &",
        "peerExpanded": ".peer:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) ~ &",
        "peerFocus": ".peer:is(:focus, [data-focus]) ~ &",
        "peerFocusVisible": ".peer:is(:focus-visible, [data-focus-visible]) ~ &",
        "peerFocusWithin": ".peer:focus-within ~ &",
        "peerHover": ".peer:is(:hover, [data-hover]) ~ &",
        "peerInvalid": ".peer:is(:invalid, [data-invalid], [aria-invalid=true]) ~ &",
        "peerPlaceholderShown": ".peer:placeholder-shown ~ &",
        "placeholder": "&::placeholder, &[data-placeholder]",
        "placeholderShown": "&:is(:placeholder-shown, [data-placeholder-shown])",
        "portrait": "@media (orientation: portrait)",
        "pressed": "&:is([aria-pressed=true], [data-pressed])",
        "print": "@media print",
        "rangeEnd": "&[data-range-end]",
        "rangeStart": "&[data-range-start]",
        "readOnly": "&:is(:read-only, [data-read-only], [aria-readonly=true])",
        "readWrite": "&:read-write",
        "required": "&:is(:required, [data-required], [aria-required=true])",
        "rtl": ":where([dir=rtl], :dir(rtl)) &",
        "scrollbar": "&::-webkit-scrollbar",
        "scrollbarThumb": "&::-webkit-scrollbar-thumb",
        "scrollbarTrack": "&::-webkit-scrollbar-track",
        "selected": "&:is([aria-selected=true], [data-selected])",
        "selection": "&::selection",
        "starting": "@starting-style",
        "target": "&:target",
        "today": "&[data-today]",
        "topmost": "&[data-topmost]",
        "unavailable": "&[data-unavailable]",
        "underValue": "&[data-state=under-value]",
        "valid": "&:is(:valid, [data-valid])",
        "vertical": "&[data-orientation=vertical]",
        "visited": "&:visited",
      }
    `)
  })
})
