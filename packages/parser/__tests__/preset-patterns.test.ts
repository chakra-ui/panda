import { describe, test, expect } from 'vitest'
import { getFixtureProject } from './fixture'
import type { Config, TSConfig } from '@pandacss/types'

const run = (code: string, userConfig?: Config, tsconfig?: TSConfig) => {
  const { parse, generator } = getFixtureProject(code, userConfig, tsconfig)
  const result = parse()!
  return {
    json: result?.toArray().map(({ box, ...item }) => item),
    css: generator.getParserCss(result)!,
  }
}

describe('preset patterns', () => {
  // stack vstack hstack spacer circle absoluteCenter grid gridItem wrap container center aspectRatio
  test('box', () => {
    const code = `
      import { box } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={box({ color: "blue.100" })}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "box",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('jsx box', () => {
    const code = `
      import { Box } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Box color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('flex', () => {
    const code = `
      import { flex } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={flex()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "flex",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }
      }"
    `)
  })

  test('jsx flex', () => {
    const code = `
      import { Flex } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Flex color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Flex",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('stack', () => {
    const code = `
      import { stack } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={stack()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "stack",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .flex_column {
          flex-direction: column
          }

        .gap_10px {
          gap: 10px
          }
      }"
    `)
  })

  test('jsx stack', () => {
    const code = `
      import { Stack } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Stack color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Stack",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .flex_column {
          flex-direction: column
          }

        .gap_10px {
          gap: 10px
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('vstack', () => {
    const code = `
      import { vstack } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={vstack()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "vstack",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .gap_10px {
          gap: 10px
          }

        .flex_column {
          flex-direction: column
          }
      }"
    `)
  })

  test('jsx vStack', () => {
    const code = `
      import { VStack } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <VStack color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "VStack",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .gap_10px {
          gap: 10px
          }

        .flex_column {
          flex-direction: column
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('hstack', () => {
    const code = `
      import { hstack } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={hstack()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "hstack",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .gap_10px {
          gap: 10px
          }

        .flex_row {
          flex-direction: row
          }
      }"
    `)
  })

  test('jsx hStack', () => {
    const code = `
      import { HStack } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <HStack color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "HStack",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .gap_10px {
          gap: 10px
          }

        .flex_row {
          flex-direction: row
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('spacer', () => {
    const code = `
      import { spacer } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={spacer()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "spacer",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .self_stretch {
          align-self: stretch
          }

        .justify-self_stretch {
          justify-self: stretch
          }

        .flex_1 {
          flex: 1 1 0%
          }
      }"
    `)
  })

  test('linkOverlay, linkBox', () => {
    const code = `
      import { linkOverlay, linkBox } from ".panda/patterns"

      function Button() {
        return (
          <div className={linkBox()}>
              <a className={linkOverlay()}>Click me</a>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "linkBox",
          "type": "pattern",
        },
        {
          "data": [
            {},
          ],
          "name": "linkOverlay",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .\\\\[\\\\&_\\\\:where\\\\(a\\\\,_abbr\\\\)\\\\]\\\\:pos_relative :where(a, abbr) {
          position: relative
              }

        .\\\\[\\\\&_\\\\:where\\\\(a\\\\,_abbr\\\\)\\\\]\\\\:z_1 :where(a, abbr) {
          z-index: 1
              }

        .pos_static {
          position: static
          }

        .before\\\\:content_\\\\\\"\\\\\\"::before {
          content: \\"\\"
              }

        .before\\\\:d_block::before {
          display: block
              }

        .before\\\\:pos_absolute::before {
          position: absolute
              }

        .before\\\\:cursor_inherit::before {
          cursor: inherit
              }

        .before\\\\:inset_0::before {
          inset: var(--spacing-0)
              }

        .before\\\\:z_0::before {
          z-index: 0
              }
      }"
    `)
  })

  test('jsx linkOverlay, linkBox', () => {
    const code = `
      import { LinkBox, LinkOverlay } from ".panda/jsx"

      function Button() {
        return (
          <LinkBox>
              <LinkOverlay>Click me</LinkOverlay>
          </LinkBox>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "LinkBox",
          "type": "jsx-pattern",
        },
        {
          "data": [
            {},
          ],
          "name": "LinkOverlay",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .\\\\[\\\\&_\\\\:where\\\\(a\\\\,_abbr\\\\)\\\\]\\\\:pos_relative :where(a, abbr) {
          position: relative
              }

        .\\\\[\\\\&_\\\\:where\\\\(a\\\\,_abbr\\\\)\\\\]\\\\:z_1 :where(a, abbr) {
          z-index: 1
              }

        .pos_static {
          position: static
          }

        .before\\\\:content_\\\\\\"\\\\\\"::before {
          content: \\"\\"
              }

        .before\\\\:d_block::before {
          display: block
              }

        .before\\\\:pos_absolute::before {
          position: absolute
              }

        .before\\\\:cursor_inherit::before {
          cursor: inherit
              }

        .before\\\\:inset_0::before {
          inset: var(--spacing-0)
              }

        .before\\\\:z_0::before {
          z-index: 0
              }
      }"
    `)
  })

  test('jsx spacer', () => {
    const code = `
      import { Spacer } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Spacer color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Spacer",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .self_stretch {
          align-self: stretch
          }

        .justify-self_stretch {
          justify-self: stretch
          }

        .flex_1 {
          flex: 1 1 0%
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('circle', () => {
    const code = `
      import { circle } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={circle()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "circle",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .justify_center {
          justify-content: center
          }

        .flex_0_0_auto {
          flex: 0 0 auto
          }

        .rounded_9999px {
          border-radius: 9999px
          }
      }"
    `)
  })

  test('jsx circle', () => {
    const code = `
      import { Circle } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Circle color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Circle",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .justify_center {
          justify-content: center
          }

        .flex_0_0_auto {
          flex: 0 0 auto
          }

        .rounded_9999px {
          border-radius: 9999px
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('float', () => {
    const code = `
      import { float } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={float()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "float",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_inline-flex {
          display: inline-flex
          }

        .justify_center {
          justify-content: center
          }

        .items_center {
          align-items: center
          }

        .pos_absolute {
          position: absolute
          }

        .inset-t_0 {
          inset-block-start: var(--spacing-0)
          }

        .inset-b_auto {
          inset-block-end: auto
          }

        .start_auto {
          inset-inline-start: auto
          }

        .end_0 {
          inset-inline-end: var(--spacing-0)
          }

        .translate_50\\\\%_-50\\\\% {
          translate: 50% -50%
          }
      }"
    `)
  })

  test('jsx absoluteCenter', () => {
    const code = `
      import { Float } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Float color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Float",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_inline-flex {
          display: inline-flex
          }

        .justify_center {
          justify-content: center
          }

        .items_center {
          align-items: center
          }

        .pos_absolute {
          position: absolute
          }

        .inset-t_0 {
          inset-block-start: var(--spacing-0)
          }

        .inset-b_auto {
          inset-block-end: auto
          }

        .start_auto {
          inset-inline-start: auto
          }

        .end_0 {
          inset-inline-end: var(--spacing-0)
          }

        .translate_50\\\\%_-50\\\\% {
          translate: 50% -50%
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('grid', () => {
    const code = `
      import { grid } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={grid()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "grid",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_grid {
          display: grid
          }

        .gap_10px {
          gap: 10px
          }
      }"
    `)
  })

  test('jsx grid', () => {
    const code = `
      import { Grid } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Grid color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Grid",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_grid {
          display: grid
          }

        .gap_10px {
          gap: 10px
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('gridItem', () => {
    const code = `
      import { gridItem } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={gridItem()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "gridItem",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot('""')
  })

  test('jsx gridItem', () => {
    const code = `
      import { GridItem } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <GridItem color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "GridItem",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('wrap', () => {
    const code = `
      import { wrap } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={wrap()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "wrap",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .flex-wrap_wrap {
          flex-wrap: wrap
          }

        .gap_10px {
          gap: 10px
          }
      }"
    `)
  })

  test('jsx wrap', () => {
    const code = `
      import { Wrap } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Wrap color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Wrap",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .flex-wrap_wrap {
          flex-wrap: wrap
          }

        .gap_10px {
          gap: 10px
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('container', () => {
    const code = `
      import { container } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={container()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "container",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .max-w_8xl {
          max-width: var(--sizes-8xl)
          }

        .mx_auto {
          margin-inline: auto
          }

        .px_4 {
          padding-inline: var(--spacing-4)
          }

        @media screen and (min-width: 48em) {
          .md\\\\:px_6 {
            padding-inline: var(--spacing-6)
          }
              }

        @media screen and (min-width: 64em) {
          .lg\\\\:px_8 {
            padding-inline: var(--spacing-8)
          }
              }
      }"
    `)
  })

  test('jsx container', () => {
    const code = `
      import { Container } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Container color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Container",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .max-w_8xl {
          max-width: var(--sizes-8xl)
          }

        .mx_auto {
          margin-inline: auto
          }

        .px_4 {
          padding-inline: var(--spacing-4)
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }

        @media screen and (min-width: 48em) {
          .md\\\\:px_6 {
            padding-inline: var(--spacing-6)
          }
              }

        @media screen and (min-width: 64em) {
          .lg\\\\:px_8 {
            padding-inline: var(--spacing-8)
          }
              }
      }"
    `)
  })

  test('center', () => {
    const code = `
      import { center } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={center()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "center",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .justify_center {
          justify-content: center
          }
      }"
    `)
  })

  test('jsx center', () => {
    const code = `
      import { Center } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Center color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Center",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .justify_center {
          justify-content: center
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('aspectRatio', () => {
    const code = `
      import { aspectRatio } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={aspectRatio()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "aspectRatio",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .before\\\\:content_\\\\\\"\\\\\\"::before {
          content: \\"\\"
              }

        .before\\\\:d_block::before {
          display: block
              }

        .before\\\\:h_0::before {
          height: var(--sizes-0)
              }

        .before\\\\:pb_75\\\\%::before {
          padding-bottom: 75%
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:d_flex>* {
          display: flex
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:justify_center>* {
          justify-content: center
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:items_center>* {
          align-items: center
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:overflow_hidden>* {
          overflow: hidden
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:pos_absolute>* {
          position: absolute
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:inset_0>* {
          inset: var(--spacing-0)
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:w_100\\\\%>* {
          width: 100%
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:h_100\\\\%>* {
          height: 100%
              }

        .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover>img, .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover>video {
          object-fit: cover
              }
      }"
    `)
  })

  test('jsx aspectRatio', () => {
    const code = `
      import { AspectRatio } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <AspectRatio color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "AspectRatio",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .before\\\\:content_\\\\\\"\\\\\\"::before {
          content: \\"\\"
              }

        .before\\\\:d_block::before {
          display: block
              }

        .before\\\\:h_0::before {
          height: var(--sizes-0)
              }

        .before\\\\:pb_75\\\\%::before {
          padding-bottom: 75%
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:d_flex>* {
          display: flex
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:justify_center>* {
          justify-content: center
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:items_center>* {
          align-items: center
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:overflow_hidden>* {
          overflow: hidden
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:pos_absolute>* {
          position: absolute
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:inset_0>* {
          inset: var(--spacing-0)
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:w_100\\\\%>* {
          width: 100%
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:h_100\\\\%>* {
          height: 100%
              }

        .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover>img, .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover>video {
          object-fit: cover
              }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('nested outdir + tsconfig.compilerOptions.baseUrl importMap behaviour', () => {
    const code = `
    import { css } from "../styled-system/css";
    import { container } from "../styled-system/patterns";

    export default function App() {
      return (
        <div
          className={container({
            page: "A4",
            width: {
              _print: "210mm",
            },
            height: {
              _print: "297mm",
              base: "600px",
            },
            display: "flex",
            margin: "auto",
            flexDir: {
              _print: "row",
              base: "column",
              sm: "row",
            },
          })}
        >
          <div className={css({ flex: 2 })}>aaa</div>
          <div className={css({ flex: 1 })}>bbb</div>
        </div>
      );
    }

     `
    const result = run(code, { outdir: 'src/styled-system', cwd: 'app' }, { compilerOptions: { baseUrl: 'app/src' } })
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "flex": 2,
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "flex": 1,
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "display": "flex",
              "flexDir": {
                "_print": "row",
                "base": "column",
                "sm": "row",
              },
              "height": {
                "_print": "297mm",
                "base": "600px",
              },
              "margin": "auto",
              "page": "A4",
              "width": {
                "_print": "210mm",
              },
            },
          ],
          "name": "container",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .flex_2 {
          flex: 2
          }

        .flex_1 {
          flex: 1 1 0%
          }

        .pos_relative {
          position: relative
          }

        .max-w_8xl {
          max-width: var(--sizes-8xl)
          }

        .mx_auto {
          margin-inline: auto
          }

        .px_4 {
          padding-inline: var(--spacing-4)
          }

        .page_A4 {
          page: A4
          }

        .h_600px {
          height: 600px
          }

        .d_flex {
          display: flex
          }

        .m_auto {
          margin: auto
          }

        .flex_column {
          flex-direction: column
          }

        @media screen and (min-width: 40em) {
          .sm\\\\:flex_row {
            flex-direction: row
          }
              }

        @media screen and (min-width: 48em) {
          .md\\\\:px_6 {
            padding-inline: var(--spacing-6)
          }
              }

        @media screen and (min-width: 64em) {
          .lg\\\\:px_8 {
            padding-inline: var(--spacing-8)
          }
              }

        @media print {
          .print\\\\:w_210mm {
            width: 210mm
          }

          .print\\\\:h_297mm {
            height: 297mm
          }

          .print\\\\:flex_row {
            flex-direction: row
          }
              }
      }"
    `)
  })

  test('{fn}.raw', () => {
    const code = `
    import { css } from ".panda/css";
    import { buttonStyle } from ".panda/recipes";
    import { stack } from ".panda/patterns";

    const filePath = String.raw\`C:\\Development\\profile\\aboutme.html\`;

    css.raw({ mx: '3', paddingTop: '4', color: 'amber.100' }, { mx: '10', pt: '6', color: 'blue.950' })

    export default function App() {
      return (
        <ButtonStyle rootProps={css.raw({ bg: "red.400" })} />
      );
    }

    // recipe in storybook
    export const Funky: Story = {
      args: buttonStyle.raw({
        visual: "funky",
        shape: "circle",
        size: "sm",
      }),
    };

    // mixed with pattern
    const stackProps = {
      sm: stack.raw({ direction: "column" }),
      md: stack.raw({ direction: "row" })
    }

    stack(stackProps[props.size]))

     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "amber.100",
              "mx": "3",
              "paddingTop": "4",
            },
            {
              "color": "blue.950",
              "mx": "10",
              "pt": "6",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "bg": "red.400",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {},
          ],
          "name": "ButtonStyle",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {
              "shape": "circle",
              "size": "sm",
              "visual": "funky",
            },
          ],
          "name": "buttonStyle",
          "type": "recipe",
        },
        {
          "data": [
            {
              "direction": "column",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {
              "direction": "row",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {},
          ],
          "name": "stack",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .mx_3 {
          margin-inline: var(--spacing-3)
          }

        .pt_4 {
          padding-top: var(--spacing-4)
          }

        .text_amber\\\\.100 {
          color: var(--colors-amber-100)
          }

        .mx_10 {
          margin-inline: var(--spacing-10)
          }

        .pt_6 {
          padding-top: var(--spacing-6)
          }

        .text_blue\\\\.950 {
          color: var(--colors-blue-950)
          }

        .bg_red\\\\.400 {
          background: var(--colors-red-400)
          }

        .flex_row {
          flex-direction: row
          }

        .d_flex {
          display: flex
          }

        .flex_column {
          flex-direction: column
          }

        .gap_10px {
          gap: 10px
          }
      }

      @layer recipes {
        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem
          }

        .buttonStyle--size_sm {
          height: 2.5rem;
          min-width: 2.5rem;
          padding: 0 0.5rem
          }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: var(--colors-white);
          }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: var(--colors-black)
              }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue
              }

        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center
              }
          }
      }"
    `)
  })
})
