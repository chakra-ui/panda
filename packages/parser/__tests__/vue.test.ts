import { describe, expect, test } from 'vitest'
import { vueToTsx } from '../src/vue-to-tsx'
import { parseAndExtract } from './fixture'

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
          <div :class="css({ color: 'red', fontWeight: 'bold' })">
            <p>depth 1 children</p>
            <div :class="css({ color: 'green' })">
              <p>depth 2 children</p>
            </div>
          </div>
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
                <div class={css({ color: 'red', fontWeight: 'bold' })}>
                  <p>depth 1 children</p>
                  <div class={css({ color: 'green' })}>
                    <p>depth 2 children</p>
                  </div>
                </div>
            </template>"
    `)

    const result = parseAndExtract(transformed)
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
        {
          "data": [
            {
              "color": "red",
              "fontWeight": "bold",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "green",
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

        .text_red {
          color: red
          }

        .font_bold {
          font-weight: var(--font-weights-bold)
          }

        .text_green {
          color: green
          }
      }"
    `)
  })

  test('Nested templates', () => {
    const code = `
    <script lang="ts">
    import { css } from "styled-system/css";
  </script>

  <template>
    <div>
      <div>
        <slot name="icon"></slot>
        <div :class="hstack()">
          <p :class="css({ textStyle: 'overline' })">
            <slot name="price"></slot>
          </p>
          <div>
            <template v-if="isSelected">
              <IconRadioSelected />
            </template>
            <template v-else>
              <IconRadio />
            </template>
          </div>
        </div>
      </div>
      <h7 :class="css({ textStyle: 'h7' })"><slot name="heading"></slot></h7>
      <p :class="css({ textStyle: 'text', color: 'grey.70' })">
        <slot name="description"></slot>
      </p>
    </div>
  </template>
`

    const transformed = vueToTsx(code)
    expect(transformed).toMatchInlineSnapshot(`
      "
          import { css } from \\"styled-system/css\\";
        

      const render = <template>
          <div>
            <div>
              <slot name=\\"icon\\"></slot>
              <div class={hstack()}>
                <p class={css({ textStyle: 'overline' })}>
                  <slot name=\\"price\\"></slot>
                </p>
                <div>
                  <template v-if=\\"isSelected\\">
                    <IconRadioSelected />
                  </template>
                  <template v-else>
                    <IconRadio />
                  </template>
                </div>
              </div>
            </div>
            <h7 class={css({ textStyle: 'h7' })}><slot name=\\"heading\\"></slot></h7>
            <p class={css({ textStyle: 'text', color: 'grey.70' })}>
              <slot name=\\"description\\"></slot>
            </p>
          </div>
        </template>"
    `)

    const result = parseAndExtract(transformed)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "textStyle": "overline",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "textStyle": "h7",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "grey.70",
              "textStyle": "text",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {},
          ],
          "name": "IconRadioSelected",
          "type": "jsx",
        },
        {
          "data": [
            {},
          ],
          "name": "IconRadio",
          "type": "jsx",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text-style_overline {
          text-style: overline
          }

        .text-style_h7 {
          text-style: h7
          }

        .text-style_text {
          text-style: text
          }

        .text_grey\\\\.70 {
          color: grey.70
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
        <div :class="css({ color: 'red', fontWeight: 'bold' })">
            <p>depth 1 children</p>
            <div :class="css({ color: 'green' })">
              <p>depth 2 children</p>
            </div>
          </div>
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
              <div class={css({ color: 'red', fontWeight: 'bold' })}>
                  <p>depth 1 children</p>
                  <div class={css({ color: 'green' })}>
                    <p>depth 2 children</p>
                  </div>
                </div>
              </template>"
    `)

    const result = parseAndExtract(transformed)
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
        {
          "data": [
            {
              "color": "red",
              "fontWeight": "bold",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "green",
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

        .text_red {
          color: red
          }

        .font_bold {
          font-weight: var(--font-weights-bold)
          }

        .text_green {
          color: green
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
      <div :class="css({ color: 'red', fontWeight: 'bold' })">
        <p>depth 1 children</p>
        <div :class="css({ color: 'green' })">
          <p>depth 2 children</p>
        </div>
      </div>
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
            <div class={css({ color: 'red', fontWeight: 'bold' })}>
              <p>depth 1 children</p>
              <div class={css({ color: 'green' })}>
                <p>depth 2 children</p>
              </div>
            </div>
          </template>"
    `)

    const result = parseAndExtract(transformed)
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
        {
          "data": [
            {
              "color": "red",
              "fontWeight": "bold",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "green",
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

        .text_red {
          color: red
          }

        .font_bold {
          font-weight: var(--font-weights-bold)
          }

        .text_green {
          color: green
          }
      }"
    `)
  })
})
