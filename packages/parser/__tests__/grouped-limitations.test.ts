import { createCss } from '@pandacss/shared'
import { createContext } from '@pandacss/fixture'
import { describe, test, expect } from 'vitest'
import { parseAndExtract } from './fixture'

function createRuntimeCss() {
  const ctx = createContext()
  return createCss({
    grouped: true,
    conditions: {
      shift: ctx.conditions.shift,
      finalize: ctx.conditions.finalize,
      breakpoints: { keys: ctx.conditions.breakpoints.keys },
    },
    utility: {
      prefix: ctx.utility.prefix,
      hasShorthand: ctx.utility.hasShorthand,
      resolveShorthand: ctx.utility.resolveShorthand.bind(ctx.utility),
      transform: ctx.utility.transform.bind(ctx.utility),
      toHash: ctx.utility.toHash.bind(ctx.utility),
    },
  })
}

describe('cssMode: grouped — known limitations', () => {
  test('unresolvable value: build only sees partial styles, runtime hash diverges', () => {
    const code = `
    import { css } from "styled-system/css"

    function App(props: { color: string }) {
      return <div className={css({ fontSize: "xl", color: props.color })} />
    }
    `
    const result = parseAndExtract(code, { cssMode: 'grouped' })

    // Build only extracts { fontSize: "xl" } — drops unresolvable props.color
    expect(result.json[0].data).toEqual([{ fontSize: 'xl' }])
    expect(result.encoder.grouped.size).toBe(1)
    expect(result.css).toContain('font-size')
    expect(result.css).not.toContain('color')

    // Runtime sees the full object and computes a different hash
    const cssFn = createRuntimeCss()
    const runtimeClass = cssFn({ fontSize: 'xl', color: 'red' })

    // The build-generated CSS has no rule for the runtime's class
    expect(result.css).not.toContain(runtimeClass)
  })

  test('ternary: parser splits branches into separate groups, none match the full runtime object', () => {
    const code = `
    import { css } from "styled-system/css"
    import { useState } from "react"

    function App() {
      const [active, setActive] = useState(false)
      return <div className={css({ fontSize: "xl", color: active ? "red" : "blue" })} />
    }
    `
    const result = parseAndExtract(code, { cssMode: 'grouped' })

    // Parser produces 3 separate data entries — never the combined object
    expect(result.json[0].data).toEqual([{ color: 'red' }, { color: 'blue' }, { fontSize: 'xl' }])
    expect(result.encoder.grouped.size).toBe(3)

    // Runtime evaluates the ternary and sees { fontSize: "xl", color: "red" } as one object
    const cssFn = createRuntimeCss()
    const runtimeClass = cssFn({ fontSize: 'xl', color: 'red' })

    // No build-generated rule matches the runtime's combined hash
    expect(result.css).not.toContain(runtimeClass)
  })

  test('css.raw merging: build sees individual parts, runtime sees merged result', () => {
    const code = `
    import { css } from "styled-system/css"

    const base = css.raw({ fontSize: "xl" })
    const extra = css.raw({ color: "red" })

    function App() {
      return <div className={css(base, extra)} />
    }
    `
    const result = parseAndExtract(code, { cssMode: 'grouped' })

    // Build produces separate groups for each raw object
    expect(result.encoder.grouped.size).toBe(2)
    expect(result.css).toContain('font-size')
    expect(result.css).toContain('color')

    // Runtime merges the raw objects and hashes the combined result
    const cssFn = createRuntimeCss()
    const runtimeClass = cssFn({ fontSize: 'xl', color: 'red' })

    // No build-generated rule matches the merged hash
    expect(result.css).not.toContain(runtimeClass)
  })

  // --- Cases that DO work ---

  test('fully static css() works correctly', () => {
    const code = `
    import { css } from "styled-system/css"

    css({ fontSize: "xl", color: "red" })
    `
    const result = parseAndExtract(code, { cssMode: 'grouped' })

    expect(result.encoder.grouped.size).toBe(1)

    const cssFn = createRuntimeCss()
    const runtimeClass = cssFn({ fontSize: 'xl', color: 'red' })

    // Build and runtime agree
    expect(result.css).toContain(runtimeClass)
  })

  test('spread from statically resolvable const works correctly', () => {
    const code = `
    import { css } from "styled-system/css"

    const base = { fontSize: "xl" }

    function App() {
      return <div className={css({ ...base, color: "red" })} />
    }
    `
    const result = parseAndExtract(code, { cssMode: 'grouped' })

    expect(result.encoder.grouped.size).toBe(1)

    const cssFn = createRuntimeCss()
    const runtimeClass = cssFn({ fontSize: 'xl', color: 'red' })

    // Build and runtime agree
    expect(result.css).toContain(runtimeClass)
  })
})
