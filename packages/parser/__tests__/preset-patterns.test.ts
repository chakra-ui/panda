import { describe, expect, test } from 'vitest'
import { parseAndExtract } from './fixture'

describe('preset patterns', () => {
  // stack vstack hstack spacer circle absoluteCenter grid gridItem wrap container center aspectRatio
  test('box', () => {
    const code = `
      import { box } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={box({ color: "blue.100" })}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { Box } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <Box color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { flex } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={flex()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { Flex } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <Flex color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { stack } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={stack()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { Stack } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <Stack color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { vstack } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={vstack()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { VStack } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <VStack color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { hstack } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={hstack()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { HStack } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <HStack color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { spacer } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={spacer()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { linkOverlay, linkBox } from "styled-system/patterns"

      function Button() {
        return (
          <div className={linkBox()}>
              <a className={linkOverlay()}>Click me</a>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { LinkBox, LinkOverlay } from "styled-system/jsx"

      function Button() {
        return (
          <LinkBox>
              <LinkOverlay>Click me</LinkOverlay>
          </LinkBox>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { Spacer } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <Spacer color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { circle } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={circle()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { Circle } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <Circle color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { float } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={float()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { Float } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <Float color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { grid } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={grid()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { Grid } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <Grid color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { gridItem } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={gridItem()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { GridItem } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <GridItem color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { wrap } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={wrap()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { Wrap } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <Wrap color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { container } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={container()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { Container } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <Container color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { center } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={center()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { Center } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <Center color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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
      import { aspectRatio } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={aspectRatio()}>Click me</div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
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
      import { AspectRatio } from "styled-system/jsx"

      function Button() {
        return (
          <div>
              <AspectRatio color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = parseAndExtract(code)
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

  test('responsive array syntax', () => {
    const code = `
      import { grid, gridItem } from "styled-system/patterns"

      function Button() {
        return (
          <div>
              <div className={grid({ columns: [2, 3, 4] })}>
                <div className={gridItem({ colSpan: [1, 2, 3] })}>Click me</div>
              </div>
          </div>
        )
      }
     `
    const result = parseAndExtract(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "columns": [
                2,
                3,
                4,
              ],
            },
          ],
          "name": "grid",
          "type": "pattern",
        },
        {
          "data": [
            {
              "colSpan": [
                1,
                2,
                3,
              ],
            },
          ],
          "name": "gridItem",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_grid {
          display: grid
      }

        .grid-cols_repeat\\\\(2\\\\,_minmax\\\\(0\\\\,_1fr\\\\)\\\\) {
          grid-template-columns: repeat(2, minmax(0, 1fr))
      }

        .gap_10px {
          gap: 10px
      }

        .col-span_span_1 {
          grid-column: span 1
      }

        @media screen and (min-width: 40em) {
          .sm\\\\:grid-cols_repeat\\\\(3\\\\,_minmax\\\\(0\\\\,_1fr\\\\)\\\\) {
            grid-template-columns: repeat(3, minmax(0, 1fr))
          }
          .sm\\\\:col-span_span_2 {
            grid-column: span 2
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:grid-cols_repeat\\\\(4\\\\,_minmax\\\\(0\\\\,_1fr\\\\)\\\\) {
            grid-template-columns: repeat(4, minmax(0, 1fr))
          }
          .md\\\\:col-span_span_3 {
            grid-column: span 3
          }
      }
      }"
    `)
  })
})

describe('staticCss', () => {
  test('type: number', () => {
    const { ctx } = parseAndExtract('', {
      staticCss: {
        patterns: {
          // type: 'number'
          aspectRatio: [{ properties: { ratio: [4 / 3, 16 / 9, 1 / 1] } }],
        },
      },
    })

    const sheet = ctx.createSheet()
    ctx.appendCssOfType('static', sheet)
    ctx.appendParserCss(sheet)

    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
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

        .before\\\\:pb_56\\\\.25\\\\%::before {
          padding-bottom: 56.25%
      }

        .before\\\\:pb_100\\\\%::before {
          padding-bottom: 100%
      }
      }"
    `)
  })

  test('type: number + conditions', () => {
    const { ctx } = parseAndExtract('', {
      staticCss: {
        patterns: {
          // type: 'number'
          aspectRatio: [{ properties: { ratio: [1 / 4] }, conditions: ['md'] }],
        },
      },
    })

    const sheet = ctx.createSheet()
    ctx.appendCssOfType('static', sheet)
    ctx.appendParserCss(sheet)

    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
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

        .before\\\\:pb_400\\\\%::before {
          padding-bottom: 400%
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

        @media screen and (min-width: 48em) {
          .md\\\\:pos_relative {
            position: relative
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:before\\\\:content_\\\\\\"\\\\\\"::before {
            content: \\"\\"
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:before\\\\:d_block::before {
            display: block
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:before\\\\:h_0::before {
            height: var(--sizes-0)
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:before\\\\:pb_400\\\\%::before {
            padding-bottom: 400%
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:d_flex>* {
            display: flex
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:justify_center>* {
            justify-content: center
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:items_center>* {
            align-items: center
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:overflow_hidden>* {
            overflow: hidden
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:pos_absolute>* {
            position: absolute
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:inset_0>* {
            inset: var(--spacing-0)
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:w_100\\\\%>* {
            width: 100%
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:h_100\\\\%>* {
            height: 100%
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover>img, .md\\\\:\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover>video {
            object-fit: cover
          }
      }
      }"
    `)
  })

  test('type: token', () => {
    const { ctx } = parseAndExtract('', {
      staticCss: {
        patterns: {
          // type: 'token'
          spacer: [{ properties: { size: ['2', '4', '6'] } }],
        },
      },
    })

    const sheet = ctx.createSheet()
    ctx.appendCssOfType('static', sheet)
    ctx.appendParserCss(sheet)

    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {

        .self_stretch {
          align-self: stretch
      }

        .justify-self_stretch {
          justify-self: stretch
      }

        .flex_0_0_2 {
          flex: 0 0 2
      }

        .flex_0_0_4 {
          flex: 0 0 4
      }

        .flex_0_0_6 {
          flex: 0 0 6
      }
      }"
    `)
  })

  test('type: property', () => {
    const { ctx } = parseAndExtract('', {
      staticCss: {
        patterns: {
          // type: 'property'
          circle: [{ properties: { size: ['sm', 'md', 'lg'] } }],
        },
      },
    })

    const sheet = ctx.createSheet()
    ctx.appendCssOfType('static', sheet)
    ctx.appendParserCss(sheet)

    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
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

        .w_sm {
          width: var(--sizes-sm)
      }

        .h_sm {
          height: var(--sizes-sm)
      }

        .rounded_9999px {
          border-radius: 9999px
      }

        .w_md {
          width: var(--sizes-md)
      }

        .h_md {
          height: var(--sizes-md)
      }

        .w_lg {
          width: var(--sizes-lg)
      }

        .h_lg {
          height: var(--sizes-lg)
      }
      }"
    `)
  })

  test('type: property *', () => {
    const { ctx } = parseAndExtract('', {
      staticCss: {
        patterns: {
          // type: 'property'
          bleed: [{ properties: { inline: ['*'] } }],
        },
      },
    })

    const sheet = ctx.createSheet()
    ctx.appendCssOfType('static', sheet)
    ctx.appendParserCss(sheet)

    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {

        .\\\\--bleed-x_spacing\\\\.0 {
          --bleed-x: var(--spacing-0)
      }

        .\\\\--bleed-y_spacing\\\\.0 {
          --bleed-y: var(--spacing-0)
      }

        .mx_calc\\\\(var\\\\(--bleed-x\\\\,_0\\\\)_\\\\*_-1\\\\) {
          margin-inline: calc(var(--bleed-x, 0) * -1)
      }

        .my_calc\\\\(var\\\\(--bleed-y\\\\,_0\\\\)_\\\\*_-1\\\\) {
          margin-block: calc(var(--bleed-y, 0) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.1 {
          --bleed-x: var(--spacing-1)
      }

        .\\\\--bleed-x_spacing\\\\.2 {
          --bleed-x: var(--spacing-2)
      }

        .\\\\--bleed-x_spacing\\\\.3 {
          --bleed-x: var(--spacing-3)
      }

        .\\\\--bleed-x_spacing\\\\.4 {
          --bleed-x: var(--spacing-4)
      }

        .\\\\--bleed-x_spacing\\\\.5 {
          --bleed-x: var(--spacing-5)
      }

        .\\\\--bleed-x_spacing\\\\.6 {
          --bleed-x: var(--spacing-6)
      }

        .\\\\--bleed-x_spacing\\\\.7 {
          --bleed-x: var(--spacing-7)
      }

        .\\\\--bleed-x_spacing\\\\.8 {
          --bleed-x: var(--spacing-8)
      }

        .\\\\--bleed-x_spacing\\\\.9 {
          --bleed-x: var(--spacing-9)
      }

        .\\\\--bleed-x_spacing\\\\.10 {
          --bleed-x: var(--spacing-10)
      }

        .\\\\--bleed-x_spacing\\\\.11 {
          --bleed-x: var(--spacing-11)
      }

        .\\\\--bleed-x_spacing\\\\.12 {
          --bleed-x: var(--spacing-12)
      }

        .\\\\--bleed-x_spacing\\\\.14 {
          --bleed-x: var(--spacing-14)
      }

        .\\\\--bleed-x_spacing\\\\.16 {
          --bleed-x: var(--spacing-16)
      }

        .\\\\--bleed-x_spacing\\\\.20 {
          --bleed-x: var(--spacing-20)
      }

        .\\\\--bleed-x_spacing\\\\.24 {
          --bleed-x: var(--spacing-24)
      }

        .\\\\--bleed-x_spacing\\\\.28 {
          --bleed-x: var(--spacing-28)
      }

        .\\\\--bleed-x_spacing\\\\.32 {
          --bleed-x: var(--spacing-32)
      }

        .\\\\--bleed-x_spacing\\\\.36 {
          --bleed-x: var(--spacing-36)
      }

        .\\\\--bleed-x_spacing\\\\.40 {
          --bleed-x: var(--spacing-40)
      }

        .\\\\--bleed-x_spacing\\\\.44 {
          --bleed-x: var(--spacing-44)
      }

        .\\\\--bleed-x_spacing\\\\.48 {
          --bleed-x: var(--spacing-48)
      }

        .\\\\--bleed-x_spacing\\\\.52 {
          --bleed-x: var(--spacing-52)
      }

        .\\\\--bleed-x_spacing\\\\.56 {
          --bleed-x: var(--spacing-56)
      }

        .\\\\--bleed-x_spacing\\\\.60 {
          --bleed-x: var(--spacing-60)
      }

        .\\\\--bleed-x_spacing\\\\.64 {
          --bleed-x: var(--spacing-64)
      }

        .\\\\--bleed-x_spacing\\\\.72 {
          --bleed-x: var(--spacing-72)
      }

        .\\\\--bleed-x_spacing\\\\.80 {
          --bleed-x: var(--spacing-80)
      }

        .\\\\--bleed-x_spacing\\\\.96 {
          --bleed-x: var(--spacing-96)
      }

        .\\\\--bleed-x_spacing\\\\.auto {
          --bleed-x: spacing.auto
      }

        .\\\\--bleed-x_spacing\\\\.0\\\\.5 {
          --bleed-x: var(--spacing-0\\\\.5)
      }

        .\\\\--bleed-x_spacing\\\\.1\\\\.5 {
          --bleed-x: var(--spacing-1\\\\.5)
      }

        .\\\\--bleed-x_spacing\\\\.2\\\\.5 {
          --bleed-x: var(--spacing-2\\\\.5)
      }

        .\\\\--bleed-x_spacing\\\\.3\\\\.5 {
          --bleed-x: var(--spacing-3\\\\.5)
      }

        .\\\\--bleed-x_spacing\\\\.gutter {
          --bleed-x: var(--spacing-gutter)
      }

        .\\\\--bleed-x_spacing\\\\.-1 {
          --bleed-x: calc(var(--spacing-1) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-2 {
          --bleed-x: calc(var(--spacing-2) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-3 {
          --bleed-x: calc(var(--spacing-3) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-4 {
          --bleed-x: calc(var(--spacing-4) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-5 {
          --bleed-x: calc(var(--spacing-5) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-6 {
          --bleed-x: calc(var(--spacing-6) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-7 {
          --bleed-x: calc(var(--spacing-7) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-8 {
          --bleed-x: calc(var(--spacing-8) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-9 {
          --bleed-x: calc(var(--spacing-9) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-10 {
          --bleed-x: calc(var(--spacing-10) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-11 {
          --bleed-x: calc(var(--spacing-11) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-12 {
          --bleed-x: calc(var(--spacing-12) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-14 {
          --bleed-x: calc(var(--spacing-14) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-16 {
          --bleed-x: calc(var(--spacing-16) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-20 {
          --bleed-x: calc(var(--spacing-20) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-24 {
          --bleed-x: calc(var(--spacing-24) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-28 {
          --bleed-x: calc(var(--spacing-28) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-32 {
          --bleed-x: calc(var(--spacing-32) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-36 {
          --bleed-x: calc(var(--spacing-36) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-40 {
          --bleed-x: calc(var(--spacing-40) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-44 {
          --bleed-x: calc(var(--spacing-44) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-48 {
          --bleed-x: calc(var(--spacing-48) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-52 {
          --bleed-x: calc(var(--spacing-52) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-56 {
          --bleed-x: calc(var(--spacing-56) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-60 {
          --bleed-x: calc(var(--spacing-60) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-64 {
          --bleed-x: calc(var(--spacing-64) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-72 {
          --bleed-x: calc(var(--spacing-72) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-80 {
          --bleed-x: calc(var(--spacing-80) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-96 {
          --bleed-x: calc(var(--spacing-96) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-0\\\\.5 {
          --bleed-x: calc(var(--spacing-0\\\\.5) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-1\\\\.5 {
          --bleed-x: calc(var(--spacing-1\\\\.5) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-2\\\\.5 {
          --bleed-x: calc(var(--spacing-2\\\\.5) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-3\\\\.5 {
          --bleed-x: calc(var(--spacing-3\\\\.5) * -1)
      }

        .\\\\--bleed-x_spacing\\\\.-gutter {
          --bleed-x: calc(var(--spacing-gutter) * -1)
      }}"
    `)
  })

  test('type: enum', () => {
    const { ctx } = parseAndExtract('', {
      staticCss: {
        patterns: {
          // type: 'enum' + type: 'token'
          divider: [{ properties: { orientation: ['*'], thickness: ['*'] } }],
        },
      },
    })

    const sheet = ctx.createSheet()
    ctx.appendCssOfType('static', sheet)
    ctx.appendParserCss(sheet)

    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {

        .\\\\--thickness_1px {
          --thickness: 1px
      }

        .w_100\\\\% {
          width: 100%
      }

        .border-block-end-width_var\\\\(--thickness\\\\) {
          border-block-end-width: var(--thickness)
      }

        .h_100\\\\% {
          height: 100%
      }

        .border-e_var\\\\(--thickness\\\\) {
          border-inline-end-width: var(--thickness)
      }

        .\\\\--thickness_0 {
          --thickness: 0
      }

        .\\\\--thickness_1 {
          --thickness: 1
      }

        .\\\\--thickness_2 {
          --thickness: 2
      }

        .\\\\--thickness_3 {
          --thickness: 3
      }

        .\\\\--thickness_4 {
          --thickness: 4
      }

        .\\\\--thickness_5 {
          --thickness: 5
      }

        .\\\\--thickness_6 {
          --thickness: 6
      }

        .\\\\--thickness_7 {
          --thickness: 7
      }

        .\\\\--thickness_8 {
          --thickness: 8
      }

        .\\\\--thickness_9 {
          --thickness: 9
      }

        .\\\\--thickness_10 {
          --thickness: 10
      }

        .\\\\--thickness_11 {
          --thickness: 11
      }

        .\\\\--thickness_12 {
          --thickness: 12
      }

        .\\\\--thickness_14 {
          --thickness: 14
      }

        .\\\\--thickness_16 {
          --thickness: 16
      }

        .\\\\--thickness_20 {
          --thickness: 20
      }

        .\\\\--thickness_24 {
          --thickness: 24
      }

        .\\\\--thickness_28 {
          --thickness: 28
      }

        .\\\\--thickness_32 {
          --thickness: 32
      }

        .\\\\--thickness_36 {
          --thickness: 36
      }

        .\\\\--thickness_40 {
          --thickness: 40
      }

        .\\\\--thickness_44 {
          --thickness: 44
      }

        .\\\\--thickness_48 {
          --thickness: 48
      }

        .\\\\--thickness_52 {
          --thickness: 52
      }

        .\\\\--thickness_56 {
          --thickness: 56
      }

        .\\\\--thickness_60 {
          --thickness: 60
      }

        .\\\\--thickness_64 {
          --thickness: 64
      }

        .\\\\--thickness_72 {
          --thickness: 72
      }

        .\\\\--thickness_80 {
          --thickness: 80
      }

        .\\\\--thickness_96 {
          --thickness: 96
      }

        .\\\\--thickness_0\\\\.5 {
          --thickness: 0.5
      }

        .\\\\--thickness_1\\\\.5 {
          --thickness: 1.5
      }

        .\\\\--thickness_2\\\\.5 {
          --thickness: 2.5
      }

        .\\\\--thickness_3\\\\.5 {
          --thickness: 3.5
      }

        .\\\\--thickness_xs {
          --thickness: xs
      }

        .\\\\--thickness_sm {
          --thickness: sm
      }

        .\\\\--thickness_md {
          --thickness: md
      }

        .\\\\--thickness_lg {
          --thickness: lg
      }

        .\\\\--thickness_xl {
          --thickness: xl
      }

        .\\\\--thickness_2xl {
          --thickness: 2xl
      }

        .\\\\--thickness_3xl {
          --thickness: 3xl
      }

        .\\\\--thickness_4xl {
          --thickness: 4xl
      }

        .\\\\--thickness_5xl {
          --thickness: 5xl
      }

        .\\\\--thickness_6xl {
          --thickness: 6xl
      }

        .\\\\--thickness_7xl {
          --thickness: 7xl
      }

        .\\\\--thickness_8xl {
          --thickness: 8xl
      }

        .\\\\--thickness_prose {
          --thickness: prose
      }

        .\\\\--thickness_full {
          --thickness: full
      }

        .\\\\--thickness_min {
          --thickness: min
      }

        .\\\\--thickness_max {
          --thickness: max
      }

        .\\\\--thickness_fit {
          --thickness: fit
      }

        .\\\\--thickness_breakpoint-sm {
          --thickness: breakpoint-sm
      }

        .\\\\--thickness_breakpoint-md {
          --thickness: breakpoint-md
      }

        .\\\\--thickness_breakpoint-lg {
          --thickness: breakpoint-lg
      }

        .\\\\--thickness_breakpoint-xl {
          --thickness: breakpoint-xl
      }

        .\\\\--thickness_breakpoint-2xl {
          --thickness: breakpoint-2xl
      }}"
    `)
  })

  test('type: enum *', () => {
    const { ctx } = parseAndExtract('', {
      staticCss: {
        patterns: {
          // type: 'enum' + type: 'token'
          float: ['*'],
        },
      },
    })

    const sheet = ctx.createSheet()
    ctx.appendCssOfType('static', sheet)
    ctx.appendParserCss(sheet)

    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
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

        .end_1 {
          inset-inline-end: var(--spacing-1)
      }

        .end_2 {
          inset-inline-end: var(--spacing-2)
      }

        .end_3 {
          inset-inline-end: var(--spacing-3)
      }

        .end_4 {
          inset-inline-end: var(--spacing-4)
      }

        .end_5 {
          inset-inline-end: var(--spacing-5)
      }

        .end_6 {
          inset-inline-end: var(--spacing-6)
      }

        .end_7 {
          inset-inline-end: var(--spacing-7)
      }

        .end_8 {
          inset-inline-end: var(--spacing-8)
      }

        .end_9 {
          inset-inline-end: var(--spacing-9)
      }

        .end_10 {
          inset-inline-end: var(--spacing-10)
      }

        .end_11 {
          inset-inline-end: var(--spacing-11)
      }

        .end_12 {
          inset-inline-end: var(--spacing-12)
      }

        .end_14 {
          inset-inline-end: var(--spacing-14)
      }

        .end_16 {
          inset-inline-end: var(--spacing-16)
      }

        .end_20 {
          inset-inline-end: var(--spacing-20)
      }

        .end_24 {
          inset-inline-end: var(--spacing-24)
      }

        .end_28 {
          inset-inline-end: var(--spacing-28)
      }

        .end_32 {
          inset-inline-end: var(--spacing-32)
      }

        .end_36 {
          inset-inline-end: var(--spacing-36)
      }

        .end_40 {
          inset-inline-end: var(--spacing-40)
      }

        .end_44 {
          inset-inline-end: var(--spacing-44)
      }

        .end_48 {
          inset-inline-end: var(--spacing-48)
      }

        .end_52 {
          inset-inline-end: var(--spacing-52)
      }

        .end_56 {
          inset-inline-end: var(--spacing-56)
      }

        .end_60 {
          inset-inline-end: var(--spacing-60)
      }

        .end_64 {
          inset-inline-end: var(--spacing-64)
      }

        .end_72 {
          inset-inline-end: var(--spacing-72)
      }

        .end_80 {
          inset-inline-end: var(--spacing-80)
      }

        .end_96 {
          inset-inline-end: var(--spacing-96)
      }

        .end_0\\\\.5 {
          inset-inline-end: var(--spacing-0\\\\.5)
      }

        .end_1\\\\.5 {
          inset-inline-end: var(--spacing-1\\\\.5)
      }

        .end_2\\\\.5 {
          inset-inline-end: var(--spacing-2\\\\.5)
      }

        .end_3\\\\.5 {
          inset-inline-end: var(--spacing-3\\\\.5)
      }

        .end_gutter {
          inset-inline-end: var(--spacing-gutter)
      }

        .end_-1 {
          inset-inline-end: calc(var(--spacing-1) * -1)
      }

        .end_-2 {
          inset-inline-end: calc(var(--spacing-2) * -1)
      }

        .end_-3 {
          inset-inline-end: calc(var(--spacing-3) * -1)
      }

        .end_-4 {
          inset-inline-end: calc(var(--spacing-4) * -1)
      }

        .end_-5 {
          inset-inline-end: calc(var(--spacing-5) * -1)
      }

        .end_-6 {
          inset-inline-end: calc(var(--spacing-6) * -1)
      }

        .end_-7 {
          inset-inline-end: calc(var(--spacing-7) * -1)
      }

        .end_-8 {
          inset-inline-end: calc(var(--spacing-8) * -1)
      }

        .end_-9 {
          inset-inline-end: calc(var(--spacing-9) * -1)
      }

        .end_-10 {
          inset-inline-end: calc(var(--spacing-10) * -1)
      }

        .end_-11 {
          inset-inline-end: calc(var(--spacing-11) * -1)
      }

        .end_-12 {
          inset-inline-end: calc(var(--spacing-12) * -1)
      }

        .end_-14 {
          inset-inline-end: calc(var(--spacing-14) * -1)
      }

        .end_-16 {
          inset-inline-end: calc(var(--spacing-16) * -1)
      }

        .end_-20 {
          inset-inline-end: calc(var(--spacing-20) * -1)
      }

        .end_-24 {
          inset-inline-end: calc(var(--spacing-24) * -1)
      }

        .end_-28 {
          inset-inline-end: calc(var(--spacing-28) * -1)
      }

        .end_-32 {
          inset-inline-end: calc(var(--spacing-32) * -1)
      }

        .end_-36 {
          inset-inline-end: calc(var(--spacing-36) * -1)
      }

        .end_-40 {
          inset-inline-end: calc(var(--spacing-40) * -1)
      }

        .end_-44 {
          inset-inline-end: calc(var(--spacing-44) * -1)
      }

        .end_-48 {
          inset-inline-end: calc(var(--spacing-48) * -1)
      }

        .end_-52 {
          inset-inline-end: calc(var(--spacing-52) * -1)
      }

        .end_-56 {
          inset-inline-end: calc(var(--spacing-56) * -1)
      }

        .end_-60 {
          inset-inline-end: calc(var(--spacing-60) * -1)
      }

        .end_-64 {
          inset-inline-end: calc(var(--spacing-64) * -1)
      }

        .end_-72 {
          inset-inline-end: calc(var(--spacing-72) * -1)
      }

        .end_-80 {
          inset-inline-end: calc(var(--spacing-80) * -1)
      }

        .end_-96 {
          inset-inline-end: calc(var(--spacing-96) * -1)
      }

        .end_-0\\\\.5 {
          inset-inline-end: calc(var(--spacing-0\\\\.5) * -1)
      }

        .end_-1\\\\.5 {
          inset-inline-end: calc(var(--spacing-1\\\\.5) * -1)
      }

        .end_-2\\\\.5 {
          inset-inline-end: calc(var(--spacing-2\\\\.5) * -1)
      }

        .end_-3\\\\.5 {
          inset-inline-end: calc(var(--spacing-3\\\\.5) * -1)
      }

        .end_-gutter {
          inset-inline-end: calc(var(--spacing-gutter) * -1)
      }

        .inset-t_1 {
          inset-block-start: var(--spacing-1)
      }

        .inset-t_2 {
          inset-block-start: var(--spacing-2)
      }

        .inset-t_3 {
          inset-block-start: var(--spacing-3)
      }

        .inset-t_4 {
          inset-block-start: var(--spacing-4)
      }

        .inset-t_5 {
          inset-block-start: var(--spacing-5)
      }

        .inset-t_6 {
          inset-block-start: var(--spacing-6)
      }

        .inset-t_7 {
          inset-block-start: var(--spacing-7)
      }

        .inset-t_8 {
          inset-block-start: var(--spacing-8)
      }

        .inset-t_9 {
          inset-block-start: var(--spacing-9)
      }

        .inset-t_10 {
          inset-block-start: var(--spacing-10)
      }

        .inset-t_11 {
          inset-block-start: var(--spacing-11)
      }

        .inset-t_12 {
          inset-block-start: var(--spacing-12)
      }

        .inset-t_14 {
          inset-block-start: var(--spacing-14)
      }

        .inset-t_16 {
          inset-block-start: var(--spacing-16)
      }

        .inset-t_20 {
          inset-block-start: var(--spacing-20)
      }

        .inset-t_24 {
          inset-block-start: var(--spacing-24)
      }

        .inset-t_28 {
          inset-block-start: var(--spacing-28)
      }

        .inset-t_32 {
          inset-block-start: var(--spacing-32)
      }

        .inset-t_36 {
          inset-block-start: var(--spacing-36)
      }

        .inset-t_40 {
          inset-block-start: var(--spacing-40)
      }

        .inset-t_44 {
          inset-block-start: var(--spacing-44)
      }

        .inset-t_48 {
          inset-block-start: var(--spacing-48)
      }

        .inset-t_52 {
          inset-block-start: var(--spacing-52)
      }

        .inset-t_56 {
          inset-block-start: var(--spacing-56)
      }

        .inset-t_60 {
          inset-block-start: var(--spacing-60)
      }

        .inset-t_64 {
          inset-block-start: var(--spacing-64)
      }

        .inset-t_72 {
          inset-block-start: var(--spacing-72)
      }

        .inset-t_80 {
          inset-block-start: var(--spacing-80)
      }

        .inset-t_96 {
          inset-block-start: var(--spacing-96)
      }

        .inset-t_0\\\\.5 {
          inset-block-start: var(--spacing-0\\\\.5)
      }

        .inset-t_1\\\\.5 {
          inset-block-start: var(--spacing-1\\\\.5)
      }

        .inset-t_2\\\\.5 {
          inset-block-start: var(--spacing-2\\\\.5)
      }

        .inset-t_3\\\\.5 {
          inset-block-start: var(--spacing-3\\\\.5)
      }

        .inset-t_gutter {
          inset-block-start: var(--spacing-gutter)
      }

        .inset-t_-1 {
          inset-block-start: calc(var(--spacing-1) * -1)
      }

        .inset-t_-2 {
          inset-block-start: calc(var(--spacing-2) * -1)
      }

        .inset-t_-3 {
          inset-block-start: calc(var(--spacing-3) * -1)
      }

        .inset-t_-4 {
          inset-block-start: calc(var(--spacing-4) * -1)
      }

        .inset-t_-5 {
          inset-block-start: calc(var(--spacing-5) * -1)
      }

        .inset-t_-6 {
          inset-block-start: calc(var(--spacing-6) * -1)
      }

        .inset-t_-7 {
          inset-block-start: calc(var(--spacing-7) * -1)
      }

        .inset-t_-8 {
          inset-block-start: calc(var(--spacing-8) * -1)
      }

        .inset-t_-9 {
          inset-block-start: calc(var(--spacing-9) * -1)
      }

        .inset-t_-10 {
          inset-block-start: calc(var(--spacing-10) * -1)
      }

        .inset-t_-11 {
          inset-block-start: calc(var(--spacing-11) * -1)
      }

        .inset-t_-12 {
          inset-block-start: calc(var(--spacing-12) * -1)
      }

        .inset-t_-14 {
          inset-block-start: calc(var(--spacing-14) * -1)
      }

        .inset-t_-16 {
          inset-block-start: calc(var(--spacing-16) * -1)
      }

        .inset-t_-20 {
          inset-block-start: calc(var(--spacing-20) * -1)
      }

        .inset-t_-24 {
          inset-block-start: calc(var(--spacing-24) * -1)
      }

        .inset-t_-28 {
          inset-block-start: calc(var(--spacing-28) * -1)
      }

        .inset-t_-32 {
          inset-block-start: calc(var(--spacing-32) * -1)
      }

        .inset-t_-36 {
          inset-block-start: calc(var(--spacing-36) * -1)
      }

        .inset-t_-40 {
          inset-block-start: calc(var(--spacing-40) * -1)
      }

        .inset-t_-44 {
          inset-block-start: calc(var(--spacing-44) * -1)
      }

        .inset-t_-48 {
          inset-block-start: calc(var(--spacing-48) * -1)
      }

        .inset-t_-52 {
          inset-block-start: calc(var(--spacing-52) * -1)
      }

        .inset-t_-56 {
          inset-block-start: calc(var(--spacing-56) * -1)
      }

        .inset-t_-60 {
          inset-block-start: calc(var(--spacing-60) * -1)
      }

        .inset-t_-64 {
          inset-block-start: calc(var(--spacing-64) * -1)
      }

        .inset-t_-72 {
          inset-block-start: calc(var(--spacing-72) * -1)
      }

        .inset-t_-80 {
          inset-block-start: calc(var(--spacing-80) * -1)
      }

        .inset-t_-96 {
          inset-block-start: calc(var(--spacing-96) * -1)
      }

        .inset-t_-0\\\\.5 {
          inset-block-start: calc(var(--spacing-0\\\\.5) * -1)
      }

        .inset-t_-1\\\\.5 {
          inset-block-start: calc(var(--spacing-1\\\\.5) * -1)
      }

        .inset-t_-2\\\\.5 {
          inset-block-start: calc(var(--spacing-2\\\\.5) * -1)
      }

        .inset-t_-3\\\\.5 {
          inset-block-start: calc(var(--spacing-3\\\\.5) * -1)
      }

        .inset-t_-gutter {
          inset-block-start: calc(var(--spacing-gutter) * -1)
      }

        .inset-t_auto {
          inset-block-start: auto
      }

        .inset-b_0 {
          inset-block-end: var(--spacing-0)
      }

        .translate_50\\\\%_50\\\\% {
          translate: 50% 50%
      }

        .start_0 {
          inset-inline-start: var(--spacing-0)
      }

        .end_auto {
          inset-inline-end: auto
      }

        .translate_-50\\\\%_50\\\\% {
          translate: -50% 50%
      }

        .translate_-50\\\\%_-50\\\\% {
          translate: -50% -50%
      }

        .start_50\\\\% {
          inset-inline-start: 50%
      }

        .end_50\\\\% {
          inset-inline-end: 50%
      }

        .inset-t_50\\\\% {
          inset-block-start: 50%
      }

        .inset-b_50\\\\% {
          inset-block-end: 50%
      }
      }"
    `)
  })
})
