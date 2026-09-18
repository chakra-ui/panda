import { describe, expect, test } from 'vitest'
import { createTransformProject, lines } from '../test-utils'

const compiler = createTransformProject({ utilities: { color: {}, padding: {}, opacity: {} } })

describe('raw object replacement context', () => {
  test('parenthesizes an arrow body after a comment', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const styles = () => /* object */ css.raw({ color: 'red' })",
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"const styles = () => /* object */ ({ color: 'red' })"`)
  })

  test('parenthesizes a statement after an if condition', () => {
    const source = lines("import { css } from '@panda/css'", "if (ready) css.raw({ color: 'red' })")
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"if (ready) ({ color: 'red' })"`)
  })

  test('parenthesizes an object at the start of a logical statement', () => {
    const source = lines("import { css } from '@panda/css'", "css.raw({ color: 'red' }) || fallback")
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"({ color: 'red' }) || fallback"`)
  })

  test('parenthesizes a member object at the start of a statement', () => {
    const source = lines("import { css } from '@panda/css'", "css.raw({ color: 'red' }).color")
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"({ color: 'red' }).color"`)
  })

  test('parenthesizes a conditional test at the start of an arrow body', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const styles = () => css.raw({ color: 'red' }) ? yes : no",
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"const styles = () => ({ color: 'red' }) ? yes : no"`)
  })

  test('keeps an object in a conditional arm unwrapped', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const styles = () => ready ? css.raw({ color: 'red' }) : fallback",
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"const styles = () => ready ? { color: 'red' } : fallback"`)
  })

  test('keeps an object argument unwrapped', () => {
    const source = lines("import { css } from '@panda/css'", "accept(css.raw({ color: 'red' }))")
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"accept({ color: 'red' })"`)
  })

  test('retains existing parentheses around an arrow body', () => {
    const source = lines("import { css } from '@panda/css'", "const styles = () => (css.raw({ color: 'red' }))")
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"const styles = () => ({ color: 'red' })"`)
  })

  test('parenthesizes a merged object after an arrow-body comment', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const styles = () => /* object */ css.raw({ color: 'red' }, { padding: '4px' })",
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"const styles = () => /* object */ ({"color":"red","padding":"4px"})"`)
  })

  test('retains parentheses around a TypeScript assertion', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const styles = () => (css.raw({ color: 'red' }) as object)",
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"const styles = () => ({ color: 'red' } as object)"`)
  })

  test('parenthesizes a local recipe raw result after an arrow-body comment', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ base: { color: 'red' } })",
      'const raw = () => /* object */ styles.raw({})',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ base: 'color_red' })
      const raw = () => /* object */ ({"color":"red"})"
    `)
  })
})

describe('raw static variant selection', () => {
  test('uses the decimal value of exponent notation', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { 100: { color: 'red' } } } })",
      'const raw = styles.raw({ size: 1e2 })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ variants: { size: { '100': 'color_red' } } })
      const raw = {"color":"red"}"
    `)
  })

  test('uses the decimal value of hexadecimal notation', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { 16: { color: 'red' } } } })",
      'const raw = styles.raw({ size: 0x10 })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ variants: { size: { '16': 'color_red' } } })
      const raw = {"color":"red"}"
    `)
  })

  test('uses the decimal value of binary notation', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { 2: { color: 'red' } } } })",
      'const raw = styles.raw({ size: 0b10 })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ variants: { size: { '2': 'color_red' } } })
      const raw = {"color":"red"}"
    `)
  })

  test('uses the decimal value of octal notation', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { 8: { color: 'red' } } } })",
      'const raw = styles.raw({ size: 0o10 })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ variants: { size: { '8': 'color_red' } } })
      const raw = {"color":"red"}"
    `)
  })

  test('removes numeric separators from a variant key', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { 1000: { color: 'red' } } } })",
      'const raw = styles.raw({ size: 1_000 })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ variants: { size: { '1000': 'color_red' } } })
      const raw = {"color":"red"}"
    `)
  })

  test('removes a redundant decimal fraction from a variant key', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { 1: { color: 'red' } } } })",
      'const raw = styles.raw({ size: 1.0 })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ variants: { size: { '1': 'color_red' } } })
      const raw = {"color":"red"}"
    `)
  })

  test('normalizes negative zero to the zero variant key', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { 0: { color: 'red' } } } })",
      'const raw = styles.raw({ size: -0 })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ variants: { size: { '0': 'color_red' } } })
      const raw = {"color":"red"}"
    `)
  })

  test('selects a negative numeric variant', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { '-2': { color: 'red' } } } })",
      'const raw = styles.raw({ size: -2 })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ variants: { size: { '-2': 'color_red' } } })
      const raw = {"color":"red"}"
    `)
  })

  test('selects the false boolean variant', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { enabled: { false: { opacity: '0.5' } } } })",
      'const raw = styles.raw({ enabled: false })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ variants: { enabled: { false: 'opacity_0.5' } } })
      const raw = {"opacity":"0.5"}"
    `)
  })

  test('uses the numeric value through TypeScript and parenthesis wrappers', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { 100: { color: 'red' } } } })",
      'const raw = styles.raw({ size: (1e2 as const) })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __pcva({ variants: { size: { '100': 'color_red' } } })
      const raw = {"color":"red"}"
    `)
  })

  test('selects a numeric slot recipe variant', () => {
    const source = lines(
      "import { sva } from '@panda/css'",
      "const styles = sva({ slots: ['root'], variants: { size: { 16: { root: { color: 'red' } } } } })",
      'const raw = styles.raw({ size: 0x10 })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { sva as __psva } from '@pandacss-internal/css';
      const styles = /* @__PURE__ */ __psva({ slots: ['root'], variants: { size: { '16': 'color_red' } } })
      const raw = {"root":{"color":"red"}}"
    `)
  })

  test('keeps BigInt variant values at runtime', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { 1: { color: 'red' } } } })",
      'const raw = styles.raw({ size: 1n })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva } from '@panda/css'
      const styles = cva({ variants: { size: { 1: { color: 'red' } } } })
      const raw = styles.raw({ size: 1n })"
    `)
  })

  test('keeps regular-expression variant values at runtime', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "const styles = cva({ variants: { size: { sm: { color: 'red' } } } })",
      'const raw = styles.raw({ size: /sm/ })',
    )
    const result = compiler.transformSource({ path: 'src/raw.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva } from '@panda/css'
      const styles = cva({ variants: { size: { sm: { color: 'red' } } } })
      const raw = styles.raw({ size: /sm/ })"
    `)
  })
})
