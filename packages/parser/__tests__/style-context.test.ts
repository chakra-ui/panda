import { describe, expect, test } from 'vitest'
import { parseAndExtract } from './fixture'
import { slotRecipes } from '@pandacss/fixture'

const createExample = (code: string) => {
  const str = `
  import { createStyleContext } from 'styled-system/jsx'
  import { popover } from 'styled-system/recipes'
  import { createContext, useContext } from 'react'

  const PopoverContext = createStyleContext(popover)

  // Context-only component that doesn't render DOM
  const PopoverRoot = ({ children, open, onOpenChange }) => {
    const PopoverStateContext = createContext({ open, onOpenChange })
    return (
      <PopoverStateContext.Provider value={{ open, onOpenChange }}>
        {children}
      </PopoverStateContext.Provider>
    )
  }

  const PopoverContent = ({ children }) => {
    const { open, onOpenChange } = useContext(PopoverStateContext)
    return <div {...props} data-open={open} />
  }

  const Root = PopoverContext.withRootProvider(PopoverRoot, {
    defaultProps: { open: false }
  })
  const Trigger = PopoverContext.withRootProvider(PopoverRoot)
  const Content = PopoverContext.withContext(PopoverContent, 'content')

  export const Popover = {
    Root,
    Trigger,
    Content
  }

  ${code}
`

  return parseAndExtract(str, {
    jsxFramework: 'react',
    jsxStyleProps: 'all',
    theme: {
      extend: {
        slotRecipes,
      },
    },
  })
}

describe('style-context extraction', () => {
  test('extract root provider', () => {
    const result = createExample(`
      function App() {
        return (
          <Popover.Root>
            <Popover.Trigger>Open Popover</Popover.Trigger>
            <Popover.Content>
              Popover content here
            </Popover.Content>
          </Popover.Root>
        )
      }
    `)

    // Check extracted JSON
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "PopoverStateContext.Provider",
          "type": "jsx",
        },
        {
          "data": [
            {},
          ],
          "name": "Popover.Root",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "Popover.Trigger",
          "type": "jsx",
        },
        {
          "data": [
            {},
          ],
          "name": "Popover.Content",
          "type": "jsx-recipe",
        },
      ]
    `)

    // Check generated CSS
    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes.slots {
        @layer _base {
          .popover__content {
            background: var(--colors-white);
            box-shadow: var(--shadows-md);
      }
          }
      }"
    `)
  })

  test('extract variants', () => {
    const result = createExample(`
      function App() {
        return (
          <>
            <Popover.Root size="sm">
              <Popover.Content>Small popover</Popover.Content>
            </Popover.Root>
            <Popover.Root size="lg">
              <Popover.Content>Large popover</Popover.Content>
            </Popover.Root>
          </>
        )
      }
    `)

    // Check extracted JSON with variants
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "PopoverStateContext.Provider",
          "type": "jsx",
        },
        {
          "data": [
            {
              "size": "sm",
            },
          ],
          "name": "Popover.Root",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {
              "size": "lg",
            },
          ],
          "name": "Popover.Root",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "Popover.Content",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "Popover.Content",
          "type": "jsx-recipe",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes.slots {
        @layer _base {
          .popover__content {
            background: var(--colors-white);
            box-shadow: var(--shadows-md);
      }
      }

        .popover__content--size_sm {
          padding: var(--spacing-2);
          font-size: var(--font-sizes-sm);
          max-width: 200px;
      }

        .popover__content--size_lg {
          padding: var(--spacing-6);
          font-size: var(--font-sizes-lg);
          max-width: 400px;
      }
      }"
    `)
  })

  test('extract responsive variants', () => {
    const result = createExample(`
      function App() {
        return (
          <Popover.Root size={{ base: 'sm', md: 'lg' }}>
            <Popover.Content>Small popover</Popover.Content>
          </Popover.Root>
        )
      }
    `)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "PopoverStateContext.Provider",
          "type": "jsx",
        },
        {
          "data": [
            {
              "size": {
                "base": "sm",
                "md": "lg",
              },
            },
          ],
          "name": "Popover.Root",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "Popover.Content",
          "type": "jsx-recipe",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes.slots {
        @layer _base {
          .popover__content {
            background: var(--colors-white);
            box-shadow: var(--shadows-md);
      }
      }

        .popover__content--size_sm {
          padding: var(--spacing-2);
          font-size: var(--font-sizes-sm);
          max-width: 200px;
      }

        @media screen and (min-width: 48rem) {
          .md\\:popover__content--size_lg {
            padding: var(--spacing-6);
            font-size: var(--font-sizes-lg);
            max-width: 400px;
      }
      }
      }"
    `)
  })
})
