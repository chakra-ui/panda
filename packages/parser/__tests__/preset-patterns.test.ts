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
        .text_blue\\.100 {
          color: var(--colors-blue-100);
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
        .text_blue\\.100 {
          color: var(--colors-blue-100);
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
          display: flex;
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
          display: flex;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
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
          display: flex;
      }

        .gap_10px {
          gap: 10px;
      }

        .flex_column {
          flex-direction: column;
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
          display: flex;
      }

        .gap_10px {
          gap: 10px;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
      }

        .flex_column {
          flex-direction: column;
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
          display: flex;
      }

        .gap_10px {
          gap: 10px;
      }

        .items_center {
          align-items: center;
      }

        .flex_column {
          flex-direction: column;
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
          display: flex;
      }

        .gap_10px {
          gap: 10px;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
      }

        .items_center {
          align-items: center;
      }

        .flex_column {
          flex-direction: column;
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
          display: flex;
      }

        .gap_10px {
          gap: 10px;
      }

        .items_center {
          align-items: center;
      }

        .flex_row {
          flex-direction: row;
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
          display: flex;
      }

        .gap_10px {
          gap: 10px;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
      }

        .items_center {
          align-items: center;
      }

        .flex_row {
          flex-direction: row;
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
        .flex_1 {
          flex: 1 1 0%;
      }

        .self_stretch {
          align-self: stretch;
      }

        .justify-self_stretch {
          justify-self: stretch;
      }
      }"
    `)
  })

  test('linkOverlay', () => {
    const code = `
      import { css } from "styled-system/css"
      import { linkOverlay } from "styled-system/patterns"

      function Button() {
        return (
          <div className={css({ pos: 'relative' })}>
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
            {
              "pos": "relative",
            },
          ],
          "name": "css",
          "type": "css",
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
          position: relative;
      }

        .before\\:d_block::before {
          display: block;
      }

        .before\\:pos_absolute::before {
          position: absolute;
      }

        .before\\:cursor_inherit::before {
          cursor: inherit;
      }

        .before\\:inset_0::before {
          inset: var(--spacing-0);
      }

        .before\\:z_0::before {
          z-index: 0;
      }

        .before\\:content_\\"\\"::before {
          content: "";
      }
      }"
    `)
  })

  test('jsx linkOverlay', () => {
    const code = `
      import { Box, LinkOverlay } from "styled-system/jsx"

      function Button() {
        return (
          <Box pos="relative">
              <LinkOverlay>Click me</LinkOverlay>
          </Box>
        )
      }
     `
    const result = parseAndExtract(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "pos": "relative",
            },
          ],
          "name": "Box",
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
          position: relative;
      }

        .before\\:d_block::before {
          display: block;
      }

        .before\\:pos_absolute::before {
          position: absolute;
      }

        .before\\:cursor_inherit::before {
          cursor: inherit;
      }

        .before\\:inset_0::before {
          inset: var(--spacing-0);
      }

        .before\\:z_0::before {
          z-index: 0;
      }

        .before\\:content_\\"\\"::before {
          content: "";
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
        .flex_1 {
          flex: 1 1 0%;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
      }

        .self_stretch {
          align-self: stretch;
      }

        .justify-self_stretch {
          justify-self: stretch;
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
          display: flex;
      }

        .flex_0_0_auto {
          flex: 0 0 auto;
      }

        .rounded_9999px {
          border-radius: 9999px;
      }

        .items_center {
          align-items: center;
      }

        .justify_center {
          justify-content: center;
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
          display: flex;
      }

        .flex_0_0_auto {
          flex: 0 0 auto;
      }

        .rounded_9999px {
          border-radius: 9999px;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
      }

        .items_center {
          align-items: center;
      }

        .justify_center {
          justify-content: center;
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
          display: inline-flex;
      }

        .pos_absolute {
          position: absolute;
      }

        .inset-t_0 {
          inset-block-start: var(--spacing-0);
      }

        .inset-b_auto {
          inset-block-end: auto;
      }

        .start_auto {
          inset-inline-start: auto;
      }

        .end_0 {
          inset-inline-end: var(--spacing-0);
      }

        .translate_50\\%_-50\\% {
          translate: 50% -50%;
      }

        .justify_center {
          justify-content: center;
      }

        .items_center {
          align-items: center;
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
          display: inline-flex;
      }

        .pos_absolute {
          position: absolute;
      }

        .inset-t_0 {
          inset-block-start: var(--spacing-0);
      }

        .inset-b_auto {
          inset-block-end: auto;
      }

        .start_auto {
          inset-inline-start: auto;
      }

        .end_0 {
          inset-inline-end: var(--spacing-0);
      }

        .translate_50\\%_-50\\% {
          translate: 50% -50%;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
      }

        .justify_center {
          justify-content: center;
      }

        .items_center {
          align-items: center;
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
          display: grid;
      }

        .gap_10px {
          gap: 10px;
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
          display: grid;
      }

        .gap_10px {
          gap: 10px;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
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
        .text_blue\\.100 {
          color: var(--colors-blue-100);
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
          display: flex;
      }

        .gap_10px {
          gap: 10px;
      }

        .flex-wrap_wrap {
          flex-wrap: wrap;
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
          display: flex;
      }

        .gap_10px {
          gap: 10px;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
      }

        .flex-wrap_wrap {
          flex-wrap: wrap;
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
          position: relative;
      }

        .max-w_8xl {
          max-width: var(--sizes-8xl);
      }

        .mx_auto {
          margin-inline: auto;
      }

        .px_4 {
          padding-inline: var(--spacing-4);
      }

        @media screen and (min-width: 48rem) {
          .md\\:px_6 {
            padding-inline: var(--spacing-6);
      }
      }

        @media screen and (min-width: 64rem) {
          .lg\\:px_8 {
            padding-inline: var(--spacing-8);
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
          position: relative;
      }

        .max-w_8xl {
          max-width: var(--sizes-8xl);
      }

        .mx_auto {
          margin-inline: auto;
      }

        .px_4 {
          padding-inline: var(--spacing-4);
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
      }

        @media screen and (min-width: 48rem) {
          .md\\:px_6 {
            padding-inline: var(--spacing-6);
      }
      }

        @media screen and (min-width: 64rem) {
          .lg\\:px_8 {
            padding-inline: var(--spacing-8);
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
          display: flex;
      }

        .items_center {
          align-items: center;
      }

        .justify_center {
          justify-content: center;
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
          display: flex;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
      }

        .items_center {
          align-items: center;
      }

        .justify_center {
          justify-content: center;
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
          position: relative;
      }

        .before\\:d_block::before {
          display: block;
      }

        .before\\:h_0::before {
          height: var(--sizes-0);
      }

        .\\[\\&\\>\\*\\]\\:d_flex>* {
          display: flex;
      }

        .\\[\\&\\>\\*\\]\\:overflow_hidden>* {
          overflow: hidden;
      }

        .\\[\\&\\>\\*\\]\\:pos_absolute>* {
          position: absolute;
      }

        .\\[\\&\\>\\*\\]\\:inset_0>* {
          inset: var(--spacing-0);
      }

        .\\[\\&\\>\\*\\]\\:w_100\\%>* {
          width: 100%;
      }

        .\\[\\&\\>\\*\\]\\:h_100\\%>* {
          height: 100%;
      }

        .\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-fit_cover>img,.\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-fit_cover>video {
          object-fit: cover;
      }

        .before\\:content_\\"\\"::before {
          content: "";
      }

        .before\\:pb_75\\%::before {
          padding-bottom: 75%;
      }

        .\\[\\&\\>\\*\\]\\:justify_center>* {
          justify-content: center;
      }

        .\\[\\&\\>\\*\\]\\:items_center>* {
          align-items: center;
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
          position: relative;
      }

        .text_blue\\.100 {
          color: var(--colors-blue-100);
      }

        .before\\:d_block::before {
          display: block;
      }

        .before\\:h_0::before {
          height: var(--sizes-0);
      }

        .\\[\\&\\>\\*\\]\\:d_flex>* {
          display: flex;
      }

        .\\[\\&\\>\\*\\]\\:overflow_hidden>* {
          overflow: hidden;
      }

        .\\[\\&\\>\\*\\]\\:pos_absolute>* {
          position: absolute;
      }

        .\\[\\&\\>\\*\\]\\:inset_0>* {
          inset: var(--spacing-0);
      }

        .\\[\\&\\>\\*\\]\\:w_100\\%>* {
          width: 100%;
      }

        .\\[\\&\\>\\*\\]\\:h_100\\%>* {
          height: 100%;
      }

        .\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-fit_cover>img,.\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-fit_cover>video {
          object-fit: cover;
      }

        .before\\:content_\\"\\"::before {
          content: "";
      }

        .before\\:pb_75\\%::before {
          padding-bottom: 75%;
      }

        .\\[\\&\\>\\*\\]\\:justify_center>* {
          justify-content: center;
      }

        .\\[\\&\\>\\*\\]\\:items_center>* {
          align-items: center;
      }
      }"
    `)
  })

  test('cq', () => {
    const code = `
      import { cq } from "styled-system/patterns"
      import { css } from "styled-system/css"

      function Nav() {
        return (
          <nav className={cq({ name: 'sidebar' })}>
            <div
              className={css({
                fontSize: { base: 'lg', '@sidebar/sm': 'md' },
              })}
            />
          </nav>
        )
      }
     `
    const result = parseAndExtract(code, {
      theme: {
        extend: {
          containerNames: ['sidebar', 'content'],
        },
      },
    })
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "name": "sidebar",
            },
          ],
          "name": "cq",
          "type": "pattern",
        },
        {
          "data": [
            {
              "fontSize": {
                "@sidebar/sm": "md",
                "base": "lg",
              },
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .cq-type_inline-size {
          container-type: inline-size;
      }

        .cq-name_sidebar {
          container-name: sidebar;
      }

        .fs_lg {
          font-size: var(--font-sizes-lg);
      }

        @container sidebar (min-width: 24rem) {
          .\\@sidebar\\/sm\\:fs_md {
            font-size: var(--font-sizes-md);
      }
      }
      }"
    `)
  })

  test('jsx Cq', () => {
    const code = `
      import { Cq } from "styled-system/jsx"
      import { css } from "styled-system/css"

      function Nav() {
        return (
          <Cq name="sidebar">
            <div
              className={css({
                fontSize: { base: 'lg', '@sidebar/sm': 'md' },
              })}
            />
          </Cq>
        )
      }
     `
    const result = parseAndExtract(code, {
      theme: {
        extend: {
          containerNames: ['sidebar', 'content'],
        },
      },
    })
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "name": "sidebar",
            },
          ],
          "name": "Cq",
          "type": "jsx-pattern",
        },
        {
          "data": [
            {
              "fontSize": {
                "@sidebar/sm": "md",
                "base": "lg",
              },
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .cq-type_inline-size {
          container-type: inline-size;
      }

        .cq-name_sidebar {
          container-name: sidebar;
      }

        .fs_lg {
          font-size: var(--font-sizes-lg);
      }

        @container sidebar (min-width: 24rem) {
          .\\@sidebar\\/sm\\:fs_md {
            font-size: var(--font-sizes-md);
      }
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
          display: grid;
      }

        .gap_10px {
          gap: 10px;
      }

        .col-span_span_1 {
          grid-column: span 1;
      }

        .grid-cols_repeat\\(2\\,_minmax\\(0\\,_1fr\\)\\) {
          grid-template-columns: repeat(2, minmax(0, 1fr));
      }

        @media screen and (min-width: 40rem) {
          .sm\\:col-span_span_2 {
            grid-column: span 2;
      }
          .sm\\:grid-cols_repeat\\(3\\,_minmax\\(0\\,_1fr\\)\\) {
            grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      }

        @media screen and (min-width: 48rem) {
          .md\\:col-span_span_3 {
            grid-column: span 3;
      }
          .md\\:grid-cols_repeat\\(4\\,_minmax\\(0\\,_1fr\\)\\) {
            grid-template-columns: repeat(4, minmax(0, 1fr));
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
    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative;
      }

        .before\\:d_block::before {
          display: block;
      }

        .before\\:h_0::before {
          height: var(--sizes-0);
      }

        .\\[\\&\\>\\*\\]\\:d_flex>* {
          display: flex;
      }

        .\\[\\&\\>\\*\\]\\:overflow_hidden>* {
          overflow: hidden;
      }

        .\\[\\&\\>\\*\\]\\:pos_absolute>* {
          position: absolute;
      }

        .\\[\\&\\>\\*\\]\\:inset_0>* {
          inset: var(--spacing-0);
      }

        .\\[\\&\\>\\*\\]\\:w_100\\%>* {
          width: 100%;
      }

        .\\[\\&\\>\\*\\]\\:h_100\\%>* {
          height: 100%;
      }

        .\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-fit_cover>img,.\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-fit_cover>video {
          object-fit: cover;
      }

        .before\\:content_\\"\\"::before {
          content: "";
      }

        .before\\:pb_75\\%::before {
          padding-bottom: 75%;
      }

        .\\[\\&\\>\\*\\]\\:justify_center>* {
          justify-content: center;
      }

        .\\[\\&\\>\\*\\]\\:items_center>* {
          align-items: center;
      }

        .before\\:pb_56\\.25\\%::before {
          padding-bottom: 56.25%;
      }

        .before\\:pb_100\\%::before {
          padding-bottom: 100%;
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
    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative;
      }

        .before\\:d_block::before {
          display: block;
      }

        .before\\:h_0::before {
          height: var(--sizes-0);
      }

        .\\[\\&\\>\\*\\]\\:d_flex>* {
          display: flex;
      }

        .\\[\\&\\>\\*\\]\\:overflow_hidden>* {
          overflow: hidden;
      }

        .\\[\\&\\>\\*\\]\\:pos_absolute>* {
          position: absolute;
      }

        .\\[\\&\\>\\*\\]\\:inset_0>* {
          inset: var(--spacing-0);
      }

        .\\[\\&\\>\\*\\]\\:w_100\\%>* {
          width: 100%;
      }

        .\\[\\&\\>\\*\\]\\:h_100\\%>* {
          height: 100%;
      }

        .\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-fit_cover>img,.\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-fit_cover>video {
          object-fit: cover;
      }

        .before\\:content_\\"\\"::before {
          content: "";
      }

        .before\\:pb_400\\%::before {
          padding-bottom: 400%;
      }

        .\\[\\&\\>\\*\\]\\:justify_center>* {
          justify-content: center;
      }

        .\\[\\&\\>\\*\\]\\:items_center>* {
          align-items: center;
      }

        @media screen and (min-width: 48rem) {
          .md\\:pos_relative {
            position: relative;
      }
          .md\\:before\\:d_block::before {
            display: block;
      }
          .md\\:before\\:h_0::before {
            height: var(--sizes-0);
      }
          .md\\:\\[\\&\\>\\*\\]\\:d_flex>* {
            display: flex;
      }
          .md\\:\\[\\&\\>\\*\\]\\:overflow_hidden>* {
            overflow: hidden;
      }
          .md\\:\\[\\&\\>\\*\\]\\:pos_absolute>* {
            position: absolute;
      }
          .md\\:\\[\\&\\>\\*\\]\\:inset_0>* {
            inset: var(--spacing-0);
      }
          .md\\:\\[\\&\\>\\*\\]\\:w_100\\%>* {
            width: 100%;
      }
          .md\\:\\[\\&\\>\\*\\]\\:h_100\\%>* {
            height: 100%;
      }
          .md\\:\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-fit_cover>img,.md\\:\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-fit_cover>video {
            object-fit: cover;
      }
          .md\\:before\\:content_\\"\\"::before {
            content: "";
      }
          .md\\:before\\:pb_400\\%::before {
            padding-bottom: 400%;
      }
          .md\\:\\[\\&\\>\\*\\]\\:justify_center>* {
            justify-content: center;
      }
          .md\\:\\[\\&\\>\\*\\]\\:items_center>* {
            align-items: center;
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
    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .flex_0_0_2 {
          flex: 0 0 2;
      }

        .flex_0_0_4 {
          flex: 0 0 4;
      }

        .flex_0_0_6 {
          flex: 0 0 6;
      }

        .self_stretch {
          align-self: stretch;
      }

        .justify-self_stretch {
          justify-self: stretch;
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
    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex;
      }

        .flex_0_0_auto {
          flex: 0 0 auto;
      }

        .w_sm {
          width: var(--sizes-sm);
      }

        .h_sm {
          height: var(--sizes-sm);
      }

        .rounded_9999px {
          border-radius: 9999px;
      }

        .w_md {
          width: var(--sizes-md);
      }

        .h_md {
          height: var(--sizes-md);
      }

        .w_lg {
          width: var(--sizes-lg);
      }

        .h_lg {
          height: var(--sizes-lg);
      }

        .items_center {
          align-items: center;
      }

        .justify_center {
          justify-content: center;
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
    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\--bleed-x_token\\(spacing\\.0\\,_0\\) {
          --bleed-x: var(--spacing-0, \\30);
      }

        .\\--bleed-y_token\\(spacing\\.0\\,_0\\) {
          --bleed-y: var(--spacing-0, \\30);
      }

        .mx_calc\\(var\\(--bleed-x\\,_0\\)_\\*_-1\\) {
          margin-inline: calc(var(--bleed-x, 0) * -1);
      }

        .my_calc\\(var\\(--bleed-y\\,_0\\)_\\*_-1\\) {
          margin-block: calc(var(--bleed-y, 0) * -1);
      }

        .\\--bleed-x_token\\(spacing\\.1\\,_1\\) {
          --bleed-x: var(--spacing-1, \\31);
      }

        .\\--bleed-x_token\\(spacing\\.2\\,_2\\) {
          --bleed-x: var(--spacing-2, \\32);
      }

        .\\--bleed-x_token\\(spacing\\.3\\,_3\\) {
          --bleed-x: var(--spacing-3, \\33);
      }

        .\\--bleed-x_token\\(spacing\\.4\\,_4\\) {
          --bleed-x: var(--spacing-4, \\34);
      }

        .\\--bleed-x_token\\(spacing\\.5\\,_5\\) {
          --bleed-x: var(--spacing-5, \\35);
      }

        .\\--bleed-x_token\\(spacing\\.6\\,_6\\) {
          --bleed-x: var(--spacing-6, \\36);
      }

        .\\--bleed-x_token\\(spacing\\.7\\,_7\\) {
          --bleed-x: var(--spacing-7, \\37);
      }

        .\\--bleed-x_token\\(spacing\\.8\\,_8\\) {
          --bleed-x: var(--spacing-8, \\38);
      }

        .\\--bleed-x_token\\(spacing\\.9\\,_9\\) {
          --bleed-x: var(--spacing-9, \\39);
      }

        .\\--bleed-x_token\\(spacing\\.10\\,_10\\) {
          --bleed-x: var(--spacing-10, \\310);
      }

        .\\--bleed-x_token\\(spacing\\.11\\,_11\\) {
          --bleed-x: var(--spacing-11, \\311);
      }

        .\\--bleed-x_token\\(spacing\\.12\\,_12\\) {
          --bleed-x: var(--spacing-12, \\312);
      }

        .\\--bleed-x_token\\(spacing\\.14\\,_14\\) {
          --bleed-x: var(--spacing-14, \\314);
      }

        .\\--bleed-x_token\\(spacing\\.16\\,_16\\) {
          --bleed-x: var(--spacing-16, \\316);
      }

        .\\--bleed-x_token\\(spacing\\.20\\,_20\\) {
          --bleed-x: var(--spacing-20, \\320);
      }

        .\\--bleed-x_token\\(spacing\\.24\\,_24\\) {
          --bleed-x: var(--spacing-24, \\324);
      }

        .\\--bleed-x_token\\(spacing\\.28\\,_28\\) {
          --bleed-x: var(--spacing-28, \\328);
      }

        .\\--bleed-x_token\\(spacing\\.32\\,_32\\) {
          --bleed-x: var(--spacing-32, \\332);
      }

        .\\--bleed-x_token\\(spacing\\.36\\,_36\\) {
          --bleed-x: var(--spacing-36, \\336);
      }

        .\\--bleed-x_token\\(spacing\\.40\\,_40\\) {
          --bleed-x: var(--spacing-40, \\340);
      }

        .\\--bleed-x_token\\(spacing\\.44\\,_44\\) {
          --bleed-x: var(--spacing-44, \\344);
      }

        .\\--bleed-x_token\\(spacing\\.48\\,_48\\) {
          --bleed-x: var(--spacing-48, \\348);
      }

        .\\--bleed-x_token\\(spacing\\.52\\,_52\\) {
          --bleed-x: var(--spacing-52, \\352);
      }

        .\\--bleed-x_token\\(spacing\\.56\\,_56\\) {
          --bleed-x: var(--spacing-56, \\356);
      }

        .\\--bleed-x_token\\(spacing\\.60\\,_60\\) {
          --bleed-x: var(--spacing-60, \\360);
      }

        .\\--bleed-x_token\\(spacing\\.64\\,_64\\) {
          --bleed-x: var(--spacing-64, \\364);
      }

        .\\--bleed-x_token\\(spacing\\.72\\,_72\\) {
          --bleed-x: var(--spacing-72, \\372);
      }

        .\\--bleed-x_token\\(spacing\\.80\\,_80\\) {
          --bleed-x: var(--spacing-80, \\380);
      }

        .\\--bleed-x_token\\(spacing\\.96\\,_96\\) {
          --bleed-x: var(--spacing-96, \\396);
      }

        .\\--bleed-x_token\\(spacing\\.auto\\,_auto\\) {
          --bleed-x: var(spacing\\.auto, auto);
      }

        .\\--bleed-x_token\\(spacing\\.0\\.5\\,_0\\.5\\) {
          --bleed-x: var(--spacing-0\\.5, \\30\\.5);
      }

        .\\--bleed-x_token\\(spacing\\.1\\.5\\,_1\\.5\\) {
          --bleed-x: var(--spacing-1\\.5, \\31\\.5);
      }

        .\\--bleed-x_token\\(spacing\\.2\\.5\\,_2\\.5\\) {
          --bleed-x: var(--spacing-2\\.5, \\32\\.5);
      }

        .\\--bleed-x_token\\(spacing\\.3\\.5\\,_3\\.5\\) {
          --bleed-x: var(--spacing-3\\.5, \\33\\.5);
      }

        .\\--bleed-x_token\\(spacing\\.gutter\\,_gutter\\) {
          --bleed-x: var(--spacing-gutter, gutter);
      }

        .\\--bleed-x_token\\(spacing\\.-1\\,_-1\\) {
          --bleed-x: calc(var(--spacing-1) * -1, -\\31);
      }

        .\\--bleed-x_token\\(spacing\\.-2\\,_-2\\) {
          --bleed-x: calc(var(--spacing-2) * -1, -\\32);
      }

        .\\--bleed-x_token\\(spacing\\.-3\\,_-3\\) {
          --bleed-x: calc(var(--spacing-3) * -1, -\\33);
      }

        .\\--bleed-x_token\\(spacing\\.-4\\,_-4\\) {
          --bleed-x: calc(var(--spacing-4) * -1, -\\34);
      }

        .\\--bleed-x_token\\(spacing\\.-5\\,_-5\\) {
          --bleed-x: calc(var(--spacing-5) * -1, -\\35);
      }

        .\\--bleed-x_token\\(spacing\\.-6\\,_-6\\) {
          --bleed-x: calc(var(--spacing-6) * -1, -\\36);
      }

        .\\--bleed-x_token\\(spacing\\.-7\\,_-7\\) {
          --bleed-x: calc(var(--spacing-7) * -1, -\\37);
      }

        .\\--bleed-x_token\\(spacing\\.-8\\,_-8\\) {
          --bleed-x: calc(var(--spacing-8) * -1, -\\38);
      }

        .\\--bleed-x_token\\(spacing\\.-9\\,_-9\\) {
          --bleed-x: calc(var(--spacing-9) * -1, -\\39);
      }

        .\\--bleed-x_token\\(spacing\\.-10\\,_-10\\) {
          --bleed-x: calc(var(--spacing-10) * -1, -\\310);
      }

        .\\--bleed-x_token\\(spacing\\.-11\\,_-11\\) {
          --bleed-x: calc(var(--spacing-11) * -1, -\\311);
      }

        .\\--bleed-x_token\\(spacing\\.-12\\,_-12\\) {
          --bleed-x: calc(var(--spacing-12) * -1, -\\312);
      }

        .\\--bleed-x_token\\(spacing\\.-14\\,_-14\\) {
          --bleed-x: calc(var(--spacing-14) * -1, -\\314);
      }

        .\\--bleed-x_token\\(spacing\\.-16\\,_-16\\) {
          --bleed-x: calc(var(--spacing-16) * -1, -\\316);
      }

        .\\--bleed-x_token\\(spacing\\.-20\\,_-20\\) {
          --bleed-x: calc(var(--spacing-20) * -1, -\\320);
      }

        .\\--bleed-x_token\\(spacing\\.-24\\,_-24\\) {
          --bleed-x: calc(var(--spacing-24) * -1, -\\324);
      }

        .\\--bleed-x_token\\(spacing\\.-28\\,_-28\\) {
          --bleed-x: calc(var(--spacing-28) * -1, -\\328);
      }

        .\\--bleed-x_token\\(spacing\\.-32\\,_-32\\) {
          --bleed-x: calc(var(--spacing-32) * -1, -\\332);
      }

        .\\--bleed-x_token\\(spacing\\.-36\\,_-36\\) {
          --bleed-x: calc(var(--spacing-36) * -1, -\\336);
      }

        .\\--bleed-x_token\\(spacing\\.-40\\,_-40\\) {
          --bleed-x: calc(var(--spacing-40) * -1, -\\340);
      }

        .\\--bleed-x_token\\(spacing\\.-44\\,_-44\\) {
          --bleed-x: calc(var(--spacing-44) * -1, -\\344);
      }

        .\\--bleed-x_token\\(spacing\\.-48\\,_-48\\) {
          --bleed-x: calc(var(--spacing-48) * -1, -\\348);
      }

        .\\--bleed-x_token\\(spacing\\.-52\\,_-52\\) {
          --bleed-x: calc(var(--spacing-52) * -1, -\\352);
      }

        .\\--bleed-x_token\\(spacing\\.-56\\,_-56\\) {
          --bleed-x: calc(var(--spacing-56) * -1, -\\356);
      }

        .\\--bleed-x_token\\(spacing\\.-60\\,_-60\\) {
          --bleed-x: calc(var(--spacing-60) * -1, -\\360);
      }

        .\\--bleed-x_token\\(spacing\\.-64\\,_-64\\) {
          --bleed-x: calc(var(--spacing-64) * -1, -\\364);
      }

        .\\--bleed-x_token\\(spacing\\.-72\\,_-72\\) {
          --bleed-x: calc(var(--spacing-72) * -1, -\\372);
      }

        .\\--bleed-x_token\\(spacing\\.-80\\,_-80\\) {
          --bleed-x: calc(var(--spacing-80) * -1, -\\380);
      }

        .\\--bleed-x_token\\(spacing\\.-96\\,_-96\\) {
          --bleed-x: calc(var(--spacing-96) * -1, -\\396);
      }

        .\\--bleed-x_token\\(spacing\\.-0\\.5\\,_-0\\.5\\) {
          --bleed-x: calc(var(--spacing-0\\.5) * -1, -\\30\\.5);
      }

        .\\--bleed-x_token\\(spacing\\.-1\\.5\\,_-1\\.5\\) {
          --bleed-x: calc(var(--spacing-1\\.5) * -1, -\\31\\.5);
      }

        .\\--bleed-x_token\\(spacing\\.-2\\.5\\,_-2\\.5\\) {
          --bleed-x: calc(var(--spacing-2\\.5) * -1, -\\32\\.5);
      }

        .\\--bleed-x_token\\(spacing\\.-3\\.5\\,_-3\\.5\\) {
          --bleed-x: calc(var(--spacing-3\\.5) * -1, -\\33\\.5);
      }

        .\\--bleed-x_token\\(spacing\\.-gutter\\,_-gutter\\) {
          --bleed-x: calc(var(--spacing-gutter) * -1, \\-gutter);
      }
      }"
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
    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\--thickness_1px {
          --thickness: 1px;
      }

        .w_100\\% {
          width: 100%;
      }

        .h_100\\% {
          height: 100%;
      }

        .\\--thickness_0 {
          --thickness: 0;
      }

        .\\--thickness_1 {
          --thickness: 1;
      }

        .\\--thickness_2 {
          --thickness: 2;
      }

        .\\--thickness_3 {
          --thickness: 3;
      }

        .\\--thickness_4 {
          --thickness: 4;
      }

        .\\--thickness_5 {
          --thickness: 5;
      }

        .\\--thickness_6 {
          --thickness: 6;
      }

        .\\--thickness_7 {
          --thickness: 7;
      }

        .\\--thickness_8 {
          --thickness: 8;
      }

        .\\--thickness_9 {
          --thickness: 9;
      }

        .\\--thickness_10 {
          --thickness: 10;
      }

        .\\--thickness_11 {
          --thickness: 11;
      }

        .\\--thickness_12 {
          --thickness: 12;
      }

        .\\--thickness_14 {
          --thickness: 14;
      }

        .\\--thickness_16 {
          --thickness: 16;
      }

        .\\--thickness_20 {
          --thickness: 20;
      }

        .\\--thickness_24 {
          --thickness: 24;
      }

        .\\--thickness_28 {
          --thickness: 28;
      }

        .\\--thickness_32 {
          --thickness: 32;
      }

        .\\--thickness_36 {
          --thickness: 36;
      }

        .\\--thickness_40 {
          --thickness: 40;
      }

        .\\--thickness_44 {
          --thickness: 44;
      }

        .\\--thickness_48 {
          --thickness: 48;
      }

        .\\--thickness_52 {
          --thickness: 52;
      }

        .\\--thickness_56 {
          --thickness: 56;
      }

        .\\--thickness_60 {
          --thickness: 60;
      }

        .\\--thickness_64 {
          --thickness: 64;
      }

        .\\--thickness_72 {
          --thickness: 72;
      }

        .\\--thickness_80 {
          --thickness: 80;
      }

        .\\--thickness_96 {
          --thickness: 96;
      }

        .\\--thickness_0\\.5 {
          --thickness: 0.5;
      }

        .\\--thickness_1\\.5 {
          --thickness: 1.5;
      }

        .\\--thickness_2\\.5 {
          --thickness: 2.5;
      }

        .\\--thickness_3\\.5 {
          --thickness: 3.5;
      }

        .\\--thickness_xs {
          --thickness: xs;
      }

        .\\--thickness_sm {
          --thickness: sm;
      }

        .\\--thickness_md {
          --thickness: md;
      }

        .\\--thickness_lg {
          --thickness: lg;
      }

        .\\--thickness_xl {
          --thickness: xl;
      }

        .\\--thickness_2xl {
          --thickness: 2xl;
      }

        .\\--thickness_3xl {
          --thickness: 3xl;
      }

        .\\--thickness_4xl {
          --thickness: 4xl;
      }

        .\\--thickness_5xl {
          --thickness: 5xl;
      }

        .\\--thickness_6xl {
          --thickness: 6xl;
      }

        .\\--thickness_7xl {
          --thickness: 7xl;
      }

        .\\--thickness_8xl {
          --thickness: 8xl;
      }

        .\\--thickness_prose {
          --thickness: prose;
      }

        .\\--thickness_full {
          --thickness: full;
      }

        .\\--thickness_min {
          --thickness: min;
      }

        .\\--thickness_max {
          --thickness: max;
      }

        .\\--thickness_fit {
          --thickness: fit;
      }

        .\\--thickness_breakpoint-sm {
          --thickness: breakpoint-sm;
      }

        .\\--thickness_breakpoint-md {
          --thickness: breakpoint-md;
      }

        .\\--thickness_breakpoint-lg {
          --thickness: breakpoint-lg;
      }

        .\\--thickness_breakpoint-xl {
          --thickness: breakpoint-xl;
      }

        .\\--thickness_breakpoint-2xl {
          --thickness: breakpoint-2xl;
      }

        .border-block-end-width_var\\(--thickness\\) {
          border-block-end-width: var(--thickness);
      }

        .border-e_var\\(--thickness\\) {
          border-inline-end-width: var(--thickness);
      }
      }"
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
    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_inline-flex {
          display: inline-flex;
      }

        .pos_absolute {
          position: absolute;
      }

        .inset-t_0 {
          inset-block-start: var(--spacing-0);
      }

        .inset-b_auto {
          inset-block-end: auto;
      }

        .start_auto {
          inset-inline-start: auto;
      }

        .end_0 {
          inset-inline-end: var(--spacing-0);
      }

        .translate_50\\%_-50\\% {
          translate: 50% -50%;
      }

        .end_1 {
          inset-inline-end: var(--spacing-1);
      }

        .end_2 {
          inset-inline-end: var(--spacing-2);
      }

        .end_3 {
          inset-inline-end: var(--spacing-3);
      }

        .end_4 {
          inset-inline-end: var(--spacing-4);
      }

        .end_5 {
          inset-inline-end: var(--spacing-5);
      }

        .end_6 {
          inset-inline-end: var(--spacing-6);
      }

        .end_7 {
          inset-inline-end: var(--spacing-7);
      }

        .end_8 {
          inset-inline-end: var(--spacing-8);
      }

        .end_9 {
          inset-inline-end: var(--spacing-9);
      }

        .end_10 {
          inset-inline-end: var(--spacing-10);
      }

        .end_11 {
          inset-inline-end: var(--spacing-11);
      }

        .end_12 {
          inset-inline-end: var(--spacing-12);
      }

        .end_14 {
          inset-inline-end: var(--spacing-14);
      }

        .end_16 {
          inset-inline-end: var(--spacing-16);
      }

        .end_20 {
          inset-inline-end: var(--spacing-20);
      }

        .end_24 {
          inset-inline-end: var(--spacing-24);
      }

        .end_28 {
          inset-inline-end: var(--spacing-28);
      }

        .end_32 {
          inset-inline-end: var(--spacing-32);
      }

        .end_36 {
          inset-inline-end: var(--spacing-36);
      }

        .end_40 {
          inset-inline-end: var(--spacing-40);
      }

        .end_44 {
          inset-inline-end: var(--spacing-44);
      }

        .end_48 {
          inset-inline-end: var(--spacing-48);
      }

        .end_52 {
          inset-inline-end: var(--spacing-52);
      }

        .end_56 {
          inset-inline-end: var(--spacing-56);
      }

        .end_60 {
          inset-inline-end: var(--spacing-60);
      }

        .end_64 {
          inset-inline-end: var(--spacing-64);
      }

        .end_72 {
          inset-inline-end: var(--spacing-72);
      }

        .end_80 {
          inset-inline-end: var(--spacing-80);
      }

        .end_96 {
          inset-inline-end: var(--spacing-96);
      }

        .end_0\\.5 {
          inset-inline-end: var(--spacing-0\\.5);
      }

        .end_1\\.5 {
          inset-inline-end: var(--spacing-1\\.5);
      }

        .end_2\\.5 {
          inset-inline-end: var(--spacing-2\\.5);
      }

        .end_3\\.5 {
          inset-inline-end: var(--spacing-3\\.5);
      }

        .end_gutter {
          inset-inline-end: var(--spacing-gutter);
      }

        .end_-1 {
          inset-inline-end: calc(var(--spacing-1) * -1);
      }

        .end_-2 {
          inset-inline-end: calc(var(--spacing-2) * -1);
      }

        .end_-3 {
          inset-inline-end: calc(var(--spacing-3) * -1);
      }

        .end_-4 {
          inset-inline-end: calc(var(--spacing-4) * -1);
      }

        .end_-5 {
          inset-inline-end: calc(var(--spacing-5) * -1);
      }

        .end_-6 {
          inset-inline-end: calc(var(--spacing-6) * -1);
      }

        .end_-7 {
          inset-inline-end: calc(var(--spacing-7) * -1);
      }

        .end_-8 {
          inset-inline-end: calc(var(--spacing-8) * -1);
      }

        .end_-9 {
          inset-inline-end: calc(var(--spacing-9) * -1);
      }

        .end_-10 {
          inset-inline-end: calc(var(--spacing-10) * -1);
      }

        .end_-11 {
          inset-inline-end: calc(var(--spacing-11) * -1);
      }

        .end_-12 {
          inset-inline-end: calc(var(--spacing-12) * -1);
      }

        .end_-14 {
          inset-inline-end: calc(var(--spacing-14) * -1);
      }

        .end_-16 {
          inset-inline-end: calc(var(--spacing-16) * -1);
      }

        .end_-20 {
          inset-inline-end: calc(var(--spacing-20) * -1);
      }

        .end_-24 {
          inset-inline-end: calc(var(--spacing-24) * -1);
      }

        .end_-28 {
          inset-inline-end: calc(var(--spacing-28) * -1);
      }

        .end_-32 {
          inset-inline-end: calc(var(--spacing-32) * -1);
      }

        .end_-36 {
          inset-inline-end: calc(var(--spacing-36) * -1);
      }

        .end_-40 {
          inset-inline-end: calc(var(--spacing-40) * -1);
      }

        .end_-44 {
          inset-inline-end: calc(var(--spacing-44) * -1);
      }

        .end_-48 {
          inset-inline-end: calc(var(--spacing-48) * -1);
      }

        .end_-52 {
          inset-inline-end: calc(var(--spacing-52) * -1);
      }

        .end_-56 {
          inset-inline-end: calc(var(--spacing-56) * -1);
      }

        .end_-60 {
          inset-inline-end: calc(var(--spacing-60) * -1);
      }

        .end_-64 {
          inset-inline-end: calc(var(--spacing-64) * -1);
      }

        .end_-72 {
          inset-inline-end: calc(var(--spacing-72) * -1);
      }

        .end_-80 {
          inset-inline-end: calc(var(--spacing-80) * -1);
      }

        .end_-96 {
          inset-inline-end: calc(var(--spacing-96) * -1);
      }

        .end_-0\\.5 {
          inset-inline-end: calc(var(--spacing-0\\.5) * -1);
      }

        .end_-1\\.5 {
          inset-inline-end: calc(var(--spacing-1\\.5) * -1);
      }

        .end_-2\\.5 {
          inset-inline-end: calc(var(--spacing-2\\.5) * -1);
      }

        .end_-3\\.5 {
          inset-inline-end: calc(var(--spacing-3\\.5) * -1);
      }

        .end_-gutter {
          inset-inline-end: calc(var(--spacing-gutter) * -1);
      }

        .inset-t_1 {
          inset-block-start: var(--spacing-1);
      }

        .inset-t_2 {
          inset-block-start: var(--spacing-2);
      }

        .inset-t_3 {
          inset-block-start: var(--spacing-3);
      }

        .inset-t_4 {
          inset-block-start: var(--spacing-4);
      }

        .inset-t_5 {
          inset-block-start: var(--spacing-5);
      }

        .inset-t_6 {
          inset-block-start: var(--spacing-6);
      }

        .inset-t_7 {
          inset-block-start: var(--spacing-7);
      }

        .inset-t_8 {
          inset-block-start: var(--spacing-8);
      }

        .inset-t_9 {
          inset-block-start: var(--spacing-9);
      }

        .inset-t_10 {
          inset-block-start: var(--spacing-10);
      }

        .inset-t_11 {
          inset-block-start: var(--spacing-11);
      }

        .inset-t_12 {
          inset-block-start: var(--spacing-12);
      }

        .inset-t_14 {
          inset-block-start: var(--spacing-14);
      }

        .inset-t_16 {
          inset-block-start: var(--spacing-16);
      }

        .inset-t_20 {
          inset-block-start: var(--spacing-20);
      }

        .inset-t_24 {
          inset-block-start: var(--spacing-24);
      }

        .inset-t_28 {
          inset-block-start: var(--spacing-28);
      }

        .inset-t_32 {
          inset-block-start: var(--spacing-32);
      }

        .inset-t_36 {
          inset-block-start: var(--spacing-36);
      }

        .inset-t_40 {
          inset-block-start: var(--spacing-40);
      }

        .inset-t_44 {
          inset-block-start: var(--spacing-44);
      }

        .inset-t_48 {
          inset-block-start: var(--spacing-48);
      }

        .inset-t_52 {
          inset-block-start: var(--spacing-52);
      }

        .inset-t_56 {
          inset-block-start: var(--spacing-56);
      }

        .inset-t_60 {
          inset-block-start: var(--spacing-60);
      }

        .inset-t_64 {
          inset-block-start: var(--spacing-64);
      }

        .inset-t_72 {
          inset-block-start: var(--spacing-72);
      }

        .inset-t_80 {
          inset-block-start: var(--spacing-80);
      }

        .inset-t_96 {
          inset-block-start: var(--spacing-96);
      }

        .inset-t_0\\.5 {
          inset-block-start: var(--spacing-0\\.5);
      }

        .inset-t_1\\.5 {
          inset-block-start: var(--spacing-1\\.5);
      }

        .inset-t_2\\.5 {
          inset-block-start: var(--spacing-2\\.5);
      }

        .inset-t_3\\.5 {
          inset-block-start: var(--spacing-3\\.5);
      }

        .inset-t_gutter {
          inset-block-start: var(--spacing-gutter);
      }

        .inset-t_-1 {
          inset-block-start: calc(var(--spacing-1) * -1);
      }

        .inset-t_-2 {
          inset-block-start: calc(var(--spacing-2) * -1);
      }

        .inset-t_-3 {
          inset-block-start: calc(var(--spacing-3) * -1);
      }

        .inset-t_-4 {
          inset-block-start: calc(var(--spacing-4) * -1);
      }

        .inset-t_-5 {
          inset-block-start: calc(var(--spacing-5) * -1);
      }

        .inset-t_-6 {
          inset-block-start: calc(var(--spacing-6) * -1);
      }

        .inset-t_-7 {
          inset-block-start: calc(var(--spacing-7) * -1);
      }

        .inset-t_-8 {
          inset-block-start: calc(var(--spacing-8) * -1);
      }

        .inset-t_-9 {
          inset-block-start: calc(var(--spacing-9) * -1);
      }

        .inset-t_-10 {
          inset-block-start: calc(var(--spacing-10) * -1);
      }

        .inset-t_-11 {
          inset-block-start: calc(var(--spacing-11) * -1);
      }

        .inset-t_-12 {
          inset-block-start: calc(var(--spacing-12) * -1);
      }

        .inset-t_-14 {
          inset-block-start: calc(var(--spacing-14) * -1);
      }

        .inset-t_-16 {
          inset-block-start: calc(var(--spacing-16) * -1);
      }

        .inset-t_-20 {
          inset-block-start: calc(var(--spacing-20) * -1);
      }

        .inset-t_-24 {
          inset-block-start: calc(var(--spacing-24) * -1);
      }

        .inset-t_-28 {
          inset-block-start: calc(var(--spacing-28) * -1);
      }

        .inset-t_-32 {
          inset-block-start: calc(var(--spacing-32) * -1);
      }

        .inset-t_-36 {
          inset-block-start: calc(var(--spacing-36) * -1);
      }

        .inset-t_-40 {
          inset-block-start: calc(var(--spacing-40) * -1);
      }

        .inset-t_-44 {
          inset-block-start: calc(var(--spacing-44) * -1);
      }

        .inset-t_-48 {
          inset-block-start: calc(var(--spacing-48) * -1);
      }

        .inset-t_-52 {
          inset-block-start: calc(var(--spacing-52) * -1);
      }

        .inset-t_-56 {
          inset-block-start: calc(var(--spacing-56) * -1);
      }

        .inset-t_-60 {
          inset-block-start: calc(var(--spacing-60) * -1);
      }

        .inset-t_-64 {
          inset-block-start: calc(var(--spacing-64) * -1);
      }

        .inset-t_-72 {
          inset-block-start: calc(var(--spacing-72) * -1);
      }

        .inset-t_-80 {
          inset-block-start: calc(var(--spacing-80) * -1);
      }

        .inset-t_-96 {
          inset-block-start: calc(var(--spacing-96) * -1);
      }

        .inset-t_-0\\.5 {
          inset-block-start: calc(var(--spacing-0\\.5) * -1);
      }

        .inset-t_-1\\.5 {
          inset-block-start: calc(var(--spacing-1\\.5) * -1);
      }

        .inset-t_-2\\.5 {
          inset-block-start: calc(var(--spacing-2\\.5) * -1);
      }

        .inset-t_-3\\.5 {
          inset-block-start: calc(var(--spacing-3\\.5) * -1);
      }

        .inset-t_-gutter {
          inset-block-start: calc(var(--spacing-gutter) * -1);
      }

        .inset-t_auto {
          inset-block-start: auto;
      }

        .inset-b_0 {
          inset-block-end: var(--spacing-0);
      }

        .translate_50\\%_50\\% {
          translate: 50% 50%;
      }

        .start_0 {
          inset-inline-start: var(--spacing-0);
      }

        .end_auto {
          inset-inline-end: auto;
      }

        .translate_-50\\%_50\\% {
          translate: -50% 50%;
      }

        .translate_-50\\%_-50\\% {
          translate: -50% -50%;
      }

        .start_50\\% {
          inset-inline-start: 50%;
      }

        .end_50\\% {
          inset-inline-end: 50%;
      }

        .inset-t_50\\% {
          inset-block-start: 50%;
      }

        .inset-b_50\\% {
          inset-block-end: 50%;
      }

        .justify_center {
          justify-content: center;
      }

        .items_center {
          align-items: center;
      }
      }"
    `)
  })
})
