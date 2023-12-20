import { describe, expect, test } from 'vitest'
import { svelteToTsx } from '../src/svelte-to-tsx'
import { parseAndExtract } from './fixture'

describe('extract svelte templates', () => {
  test('template with svelte-specific syntax + Typescript usage', () => {
    const code = `

    <script context="module">
      let moduleStyle: string = css({ color: 'blue.400' })

      type Something = "a" | "b" | "c";
      type Another = Something | "d" | "e";

      // the export keyword allows this function to imported with e.g.
      export function getStyles() {
        return style2
      }

      export let title;
      export let person;

      // this will update "document.title" whenever
      // the "title" prop changes
      $: document.title = title;

      $: {
        console.log("multiple statements can be combined");
        css({ color: 'blue.100' })
      }

      // this will update "name" when 'person' changes
      $: ({ name } = person);
    </script>

   <script lang="ts">
        import { css } from "styled-system/css";

        export let variable: boolean;
        type Something = "a" | "b" | "c";
        type Another = Something | "d" | "e";

        let style = css({ color: 'green.400' })
        let style2 = css({ color: 'purple.400' })
    </script>

    <h1 class={style}>using class binding</h1>
    <p class={css({ color: 'red.500' })}>using inline styles</p>
    <span class="style3">using actual class</span>

    {@html post.content}
    {@debug}

    <!-- this is a comment! --><h1>Hello world</h1>
    <!-- svelte-ignore a11y-autofocus -->
    <input bind:value={name} autofocus />

    {#if porridge.temperature > 100}
      <p class={css({ color: 'teal.100' })}>too hot!</p>
    {:else if 80 > porridge.temperature}
      <p class={css({ color: 'teal.200' })}>too cold!</p>
    {:else}
      <p className={css({ color: 'teal.300' })}>just right!</p>
    {/if}

    <ul>
      {#each items as item}
        <li class={css({ color: 'teal.400' })}>{item.name} x {item.qty}</li>
      {/each}
    </ul>

    {#each items as { id, name, qty }, i (id)}
      <li class={css({ color: 'teal.500' })}>{i + 1}: {name} x {qty}</li>
    {/each}

    {#await promise}
      <!-- promise is pending -->
      <p class={css({ color: 'teal.600' })}>waiting for the promise to resolve...</p>
    {:then value}
      <!-- promise was fulfilled -->
      <p>The value is {value}</p>
    {:catch error}
      <!-- promise was rejected -->
      <p class={css({ color: 'teal.700' })}>Something went wrong: {error.message}</p>
    {/await}

    <style>
      p {
        /* this will only affect <p> elements in this component */
        color: burlywood;
      }
    </style>
    `

    const transformed = svelteToTsx(code)
    expect(transformed).toMatchInlineSnapshot(`
      "let moduleStyle: string = css({ color: 'blue.400' })

            type Something = \\"a\\" | \\"b\\" | \\"c\\";
            type Another = Something | \\"d\\" | \\"e\\";

            // the export keyword allows this function to imported with e.g.
            export function getStyles() {
              return style2
            }

            export let title;
            export let person;

            // this will update \\"document.title\\" whenever
            // the \\"title\\" prop changes
            $: document.title = title;

            $: {
              console.log(\\"multiple statements can be combined\\");
              css({ color: 'blue.100' })
            }

            // this will update \\"name\\" when 'person' changes
            $: ({ name } = person);
          
              import { css } from \\"styled-system/css\\";

              export let variable: boolean;
              type Something = \\"a\\" | \\"b\\" | \\"c\\";
              type Another = Something | \\"d\\" | \\"e\\";

              let style = css({ color: 'green.400' })
              let style2 = css({ color: 'purple.400' })
          
      const render = <div><h1 class={style}>using class binding</h1>
          <p class={css({ color: 'red.500' })}>using inline styles</p>
          <span class=\\"style3\\">using actual class</span>

          {@html post.content}
          {@debug}

          <h1>Hello world</h1>
          
          <input bind:value={name} autofocus />

          {#if porridge.temperature > 100}
            <p class={css({ color: 'teal.100' })}>too hot!</p>
          {:else if 80 > porridge.temperature}
            <p class={css({ color: 'teal.200' })}>too cold!</p>
          {:else}
            <p className={css({ color: 'teal.300' })}>just right!</p>
          {/if}

          <ul>
            {#each items as item}
              <li class={css({ color: 'teal.400' })}>{item.name} x {item.qty}</li>
            {/each}
          </ul>

          {#each items as { id, name, qty }, i (id)}
            <li class={css({ color: 'teal.500' })}>{i + 1}: {name} x {qty}</li>
          {/each}

          {#await promise}
            
            <p class={css({ color: 'teal.600' })}>waiting for the promise to resolve...</p>
          {:then value}
            
            <p>The value is {value}</p>
          {:catch error}
            
            <p class={css({ color: 'teal.700' })}>Something went wrong: {error.message}</p>
          {/await}

          
          </div>"
    `)

    const result = parseAndExtract(transformed)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.400",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "css",
          "type": "object",
        },
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
              "color": "teal.100",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "teal.200",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "teal.300",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "teal.400",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "teal.500",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "teal.600",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "teal.700",
            },
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_blue\\\\.400 {
          color: var(--colors-blue-400)
      }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
      }

        .text_green\\\\.400 {
          color: var(--colors-green-400)
      }

        .text_purple\\\\.400 {
          color: var(--colors-purple-400)
      }

        .text_red\\\\.500 {
          color: var(--colors-red-500)
      }

        .text_teal\\\\.100 {
          color: var(--colors-teal-100)
      }

        .text_teal\\\\.200 {
          color: var(--colors-teal-200)
      }

        .text_teal\\\\.300 {
          color: var(--colors-teal-300)
      }

        .text_teal\\\\.400 {
          color: var(--colors-teal-400)
      }

        .text_teal\\\\.500 {
          color: var(--colors-teal-500)
      }

        .text_teal\\\\.600 {
          color: var(--colors-teal-600)
      }

        .text_teal\\\\.700 {
          color: var(--colors-teal-700)
      }
      }"
    `)
  })
})
