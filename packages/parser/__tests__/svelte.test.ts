import { describe, expect, test } from 'vitest'
import { svelteToTsx } from '../src/svelte-to-tsx'
import { getFixtureProject } from './fixture'

const run = (code: string) => {
  const { parse, generator } = getFixtureProject(code)
  const result = parse()!
  return {
    json: result?.toArray().map(({ box, ...item }) => item),
    css: generator.getParserCss(result)!,
  }
}

describe('extract svelte templates', () => {
  test('svelte basic template', () => {
    const code = `
    <script lang="ts">
        import { css } from "styled-system/css";

        let style = css({ color: 'green.400' })
        let style2 = css({ color: 'purple.400' })
    </script>

    <h1 class={style}>using class binding</h1>
    <p class={css({ color: 'red.500' })}>using inline styles</p>
    <span class="style3">using actual class</span>
    `

    const transformed = svelteToTsx(code)
    expect(transformed).toMatchInlineSnapshot(`
      "import { css } from \\"styled-system/css\\";

              let style = css({ color: 'green.400' })
              let style2 = css({ color: 'purple.400' })
          

      const render = <div><h1 class={style}>using class binding</h1>
          <p class={css({ color: 'red.500' })}>using inline styles</p>
          <span class=\\"style3\\">using actual class</span></div>"
    `)

    const result = run(transformed)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "green.400",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "purple.400",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "red.500",
            },
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_green\\\\.400 {
          color: var(--colors-green-400)
          }

        .text_purple\\\\.400 {
          color: var(--colors-purple-400)
          }

        .text_red\\\\.500 {
          color: var(--colors-red-500)
          }
      }"
    `)
  })
})
