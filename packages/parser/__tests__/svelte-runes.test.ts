import { describe, expect, test } from 'vitest'
import { pluginSvelte } from '@pandacss/plugin-svelte'
import { createContext } from '@pandacss/fixture'

const parseSvelte = (filePath: string, code: string) => {
  const plugin = pluginSvelte()
  const ctx = createContext({ hooks: plugin.hooks })
  ctx.project.addSourceFile(filePath, code)
  const result = ctx.project.parseSourceFile(filePath)
  return result?.toArray().flatMap(({ box, ...item }: any) => item) ?? []
}

describe('extract svelte with $-prefixed identifiers in script', () => {
  test('let count = $state(0)', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  let count = $state(0);

  const probeClass = css({ color: 'red' });
</script>`

    expect(parseSvelte('/app/src/probe-state.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('$state(0) as bare expression statement (no let)', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  $state(0);

  const probeClass = css({ color: 'red' });
</script>`

    expect(parseSvelte('/app/src/probe-state-call-no-let.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('let doubled = $derived(n * 2)', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  let n = 1;
  let doubled = $derived(n * 2);

  const probeClass = css({ color: 'red' });
</script>`

    expect(parseSvelte('/app/src/probe-derived.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('$effect(() => {...}) callback', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  $effect(() => {
    console.log('mounted');
  });

  const probeClass = css({ color: 'red' });
</script>`

    expect(parseSvelte('/app/src/probe-effect.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('let { x } = $props() with type annotation', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  let { x = false }: { x?: boolean } = $props();

  const probeClass = css({ color: 'red' });
</script>`

    expect(parseSvelte('/app/src/probe-props.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('user-defined $-prefixed function call (not a Svelte rune)', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  function $myFn(n: number): number {
    return n * 2;
  }
  const result = $myFn(21);

  const probeClass = css({ color: 'red' });
</script>`

    expect(parseSvelte('/app/src/probe-dollar-identifier.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('arbitrary unresolved (non-$) identifier call', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  someGlobalThing(0);

  const probeClass = css({ color: 'red' });
</script>`

    expect(parseSvelte('/app/src/probe-unresolved.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })
})

describe('extract svelte without runes (negative controls)', () => {
  test('baseline: no runes at all', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  const probeClass = css({ color: 'green' });
</script>

<p class={probeClass}>baseline</p>`

    expect(parseSvelte('/app/src/baseline-no-runes.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "green",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('$state appearing only inside a string literal', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  const literal = 'let count = $state(0);';

  const probeClass = css({ color: 'red' });
</script>`

    expect(parseSvelte('/app/src/probe-string-state.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('{#if} template directive', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  const show = true;
  const probeClass = css({ color: 'red' });
</script>

{#if show}
  <p class={probeClass}>visible</p>
{/if}`

    expect(parseSvelte('/app/src/probe-template-if.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('{#if}/{:else} template directive', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  const show = false;
  const probeClass = css({ color: 'red' });
</script>

{#if show}
  <p>shown</p>
{:else}
  <p class={probeClass}>fallback</p>
{/if}`

    expect(parseSvelte('/app/src/probe-template-else.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('{@render} template directive', () => {
    const code = `<script lang="ts">
  import { css } from '../styled-system/css';

  const fallback = () => 'hi';
  const probeClass = css({ color: 'red' });
</script>

<div class={probeClass}>
  {@render fallback()}
</div>`

    expect(parseSvelte('/app/src/probe-template-render.svelte', code)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })
})
