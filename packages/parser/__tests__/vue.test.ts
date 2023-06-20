import { describe, test, expect } from 'vitest'
import { getFixtureProject } from './fixture'
import { vueToTsx } from '../src/vue-to-tsx'

const run = (code: string) => {
  const { parse, generator } = getFixtureProject(code)
  const result = parse()!
  return {
    json: result?.toArray().map(({ box, ...item }) => item),
    css: generator.getParserCss(result)!,
  }
}

describe('extract Vue templates', () => {
  test('vue 3 composition API', () => {
    const code = `
      <script lang="ts">
        import { ref } from 'vue';
        import { css } from "styled-system/css";

        export default {
            setup() {
                const style = ref(css({ color: 'green.400' }));
                const style2 = ref(css({ color: 'purple.400' }));

                return { style, style2 };
            },
        };
      </script>

      <template>
          <h1 :class="style">using class binding</h1>
          <p :class="css({ color: 'red.500' })">using inline styles</p>
          <span class="style3">using actual class</span>
      </template>

      <style scoped>
          button {
              font-weight: bold;
          }
      </style>
     `

    const transformed = vueToTsx(code)
    expect(transformed).toMatchInlineSnapshot(`
      "
              import { ref } from 'vue';
              import { css } from \\"styled-system/css\\";

              export default {
                  setup() {
                      const style = ref(css({ color: 'green.400' }));
                      const style2 = ref(css({ color: 'purple.400' }));

                      return { style, style2 };
                  },
              };
            

      const render = <template>
                <h1 class={style}>using class binding</h1>
                <p class={css({ color: 'red.500' })}>using inline styles</p>
                <span class=\\"style3\\">using actual class</span>
            </template>"
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

  test('vue 3 script setup', () => {
    const code = `
    <script setup lang="ts">
        import { css } from "styled-system/css";

        let style = css({ color: 'green.400' })
        let style2 = css({ color: 'purple.400' })
    </script>

    <template>
        <h1 :class="style">using class binding</h1>
        <p :class="css({ color: 'red.500' })">using inline styles</p>
        <span class="style3">using actual class</span>
        </template>

    <style scoped>
        button {
            font-weight: bold;
        }
    </style>
     `

    const transformed = vueToTsx(code)
    expect(transformed).toMatchInlineSnapshot(`
      "
              import { css } from \\"styled-system/css\\";

              let style = css({ color: 'green.400' })
              let style2 = css({ color: 'purple.400' })
          

      const render = <template>
              <h1 class={style}>using class binding</h1>
              <p class={css({ color: 'red.500' })}>using inline styles</p>
              <span class=\\"style3\\">using actual class</span>
              </template>"
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

  test('vue 2 Options API template', () => {
    const code = `
    <script>
      export default {
          data() {
              return {
                style: css({ color: 'green.400' })
              }
          },
          methods: {
              getStyles() {
                return css({ color: 'purple.400' })
              }
          },
      }
    </script>

    <template>
      <h1 :class="style">using class binding</h1>
      <p :class="css({ color: 'red.500' })">using inline styles</p>
      <span class="style3">using actual class</span>
    </template>
     `

    const transformed = vueToTsx(code)
    expect(transformed).toMatchInlineSnapshot(`
      "
            export default {
                data() {
                    return {
                      style: css({ color: 'green.400' })
                    }
                },
                methods: {
                    getStyles() {
                      return css({ color: 'purple.400' })
                    }
                },
            }
          

      const render = <template>
            <h1 class={style}>using class binding</h1>
            <p class={css({ color: 'red.500' })}>using inline styles</p>
            <span class=\\"style3\\">using actual class</span>
          </template>"
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
