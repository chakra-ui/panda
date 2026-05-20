import { describe, expect, test } from 'vitest'
import { pluginSvelte } from '@pandacss/plugin-svelte'
import { createContext } from '@pandacss/fixture'

describe('extract svelte with unresolved call expressions in script', () => {
  test('$state in script does not crash extraction', () => {
    const code = `<script lang="ts">
  import { css } from 'styled-system/css'
  let count = $state(0)
  let style = css({ color: 'red.500' })
</script>
<p class={style}>hi</p>`

    const plugin = pluginSvelte()
    const ctx = createContext({ hooks: plugin.hooks })
    const filePath = '/app/src/probe.svelte'
    ctx.project.addSourceFile(filePath, code)
    const result = ctx.project.parseSourceFile(filePath)
    expect(result?.toArray().flatMap(({ box, ...item }: any) => item)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red.500",
            },
          ],
          "name": "css",
          "type": "css",
        },
      ]
    `)
  })

  test('user-defined $-prefixed function call does not crash extraction', () => {
    const code = `<script lang="ts">
  import { css } from 'styled-system/css'
  function $myFn() { return 1 }
  $myFn()
  let style = css({ color: 'green.500' })
</script>
<p class={style}>hi</p>`

    const plugin = pluginSvelte()
    const ctx = createContext({ hooks: plugin.hooks })
    const filePath = '/app/src/probe2.svelte'
    ctx.project.addSourceFile(filePath, code)
    expect(() => ctx.project.parseSourceFile(filePath)).not.toThrow()
  })

  test('non-$ unresolved identifier call does not crash extraction', () => {
    const code = `<script lang="ts">
  import { css } from 'styled-system/css'
  someGlobalThing(0)
  let style = css({ color: 'blue.500' })
</script>
<p class={style}>hi</p>`

    const plugin = pluginSvelte()
    const ctx = createContext({ hooks: plugin.hooks })
    const filePath = '/app/src/probe3.svelte'
    ctx.project.addSourceFile(filePath, code)
    expect(() => ctx.project.parseSourceFile(filePath)).not.toThrow()
  })
})
