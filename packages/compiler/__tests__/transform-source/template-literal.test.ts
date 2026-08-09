import { describe, expect, test } from 'vitest'
import { createTransformProject, lines } from '../test-utils'

// `syntax: 'template-literal'` — the styled-components-style API. `css`...`` is
// parsed to the same nested style object the object form produces, so it
// transforms to the identical atomic class string. `styled.x`...`` component
// *definitions* are left for the runtime factory (only usages/`css` inline).
const tpl = createTransformProject({
  syntax: 'template-literal',
  jsxFactory: 'panda',
  jsxFramework: 'react',
  utilities: {
    color: {},
    background: {},
    padding: {},
    fontSize: { className: 'fs' },
    display: { className: 'd' },
  },
  conditions: { hover: '&:hover' },
  theme: {
    breakpoints: { md: '768px' },
    tokens: { colors: { red: { 500: { value: '#ef4444' } } } },
  },
})

describe('compiler.transformSource: template-literal css', () => {
  test('rewrites a css template to a class string', () => {
    const source = lines("import { css } from '@panda/css'", 'export const a = css`color: red;`')
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const a = "color_red""`)
  })

  test('rewrites a multi-declaration css template to sorted classes', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      'export const a = css`color: red; padding: 4px; font-size: 12px;`',
    )
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const a = "color_red font-size_12px padding_4px""`)
  })

  test('keeps a nested pseudo selector that omits its trailing semicolon', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      'export const a = css`color: red; &:hover { color: blue }`',
    )
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const a = "color_red [&:hover]:color_blue""`)
  })

  test('keeps a nested element selector', () => {
    const source = lines("import { css } from '@panda/css'", 'export const a = css`color: red; p { color: blue }`')
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const a = "color_red [&_p]:color_blue""`)
  })

  test('keeps an @media block', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      'export const a = css`color: red; @media (min-width: 768px) { color: blue }`',
    )
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const a = "color_red [@media_(min-width:_768px)]:color_blue""`)
  })

  test('keeps a trailing declaration with no terminator', () => {
    const source = lines("import { css } from '@panda/css'", 'export const a = css`color: red; background: blue`')
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const a = "background_blue color_red""`)
  })

  test('folds a resolvable interpolation', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const red = 'red'",
      'export const a = css`color: ${red};`',
    )
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "const red = 'red'
      export const a = "color_red""
    `)
  })

  test('resolves a token() call inside a value', () => {
    const source = lines("import { css } from '@panda/css'", 'export const a = css`color: token(colors.red.500);`')
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const a = "color_token(colors.red.500)""`)
  })

  test('leaves a css template with a dynamic interpolation untouched', () => {
    const source = lines("import { css } from '@panda/css'", 'export const a = css`color: ${props.color};`')
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      export const a = css\`color: \${props.color};\`"
    `)
  })

  test('leaves an empty css template unchanged', () => {
    const source = lines("import { css } from '@panda/css'", 'export const a = css``')
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      export const a = css\`\`"
    `)
  })

  test('rewrites a css template used as a JSX className', () => {
    const source = lines("import { css } from '@panda/css'", 'export const el = <div className={css`color: red;`} />')
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className={"color_red"} />"`)
  })

  test('rewrites multiple css templates in one file', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      'export const a = css`color: red;`',
      'export const b = css`padding: 4px;`',
    )
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const a = "color_red"
      export const b = "padding_4px""
    `)
  })

  test('leaves a css.raw template untouched — raw yields a style object, not classes', () => {
    const source = lines("import { css } from '@panda/css'", 'export const a = css.raw`color: red;`')
    const result = tpl.transformSource({ path: 'src/a.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      export const a = css.raw\`color: red;\`"
    `)
  })
})

// A factory-member tagged-template *definition* desugars to the object-call form
// the object syntax already precomputes: `panda.div(__pcva({ base: '…' }))`. The
// template CSS is parsed and encoded at build time; the runtime factory (prop
// filtering, `as`, ref, className merge, style props) is untouched. Safe because
// template literals are static — Panda has no styled-components `${props}`
// interpolation to lower into CSS variables.
describe('compiler.transformSource: template-literal styled definitions', () => {
  test('desugars a factory-member definition to a precomputed cva call', () => {
    const source = lines("import { panda } from '@panda/jsx'", 'export const Box = panda.div`color: red;`')
    const result = tpl.transformSource({ path: 'src/box.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      import { panda } from '@panda/jsx'
      export const Box = panda.div(__pcva({ base: 'color_red' }))"
    `)
  })

  test('folds nested selectors into the desugared base class', () => {
    const source = lines(
      "import { panda } from '@panda/jsx'",
      'export const Box = panda.div`color: red; &:hover { color: blue }`',
    )
    const result = tpl.transformSource({ path: 'src/box.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      import { panda } from '@panda/jsx'
      export const Box = panda.div(__pcva({ base: 'color_red [&:hover]:color_blue' }))"
    `)
  })

  test('preserves the local import alias in the desugared call', () => {
    const source = lines("import { panda as p } from '@panda/jsx'", 'export const Btn = p.button`color: red;`')
    const result = tpl.transformSource({ path: 'src/btn.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      import { panda as p } from '@panda/jsx'
      export const Btn = p.button(__pcva({ base: 'color_red' }))"
    `)
  })

  test('leaves an empty styled template untouched', () => {
    const source = lines("import { panda } from '@panda/jsx'", 'export const Box = panda.div``')
    const result = tpl.transformSource({ path: 'src/box.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { panda } from '@panda/jsx'
      export const Box = panda.div\`\`"
    `)
  })

  test('leaves a styled definition with an unsupported dynamic interpolation untouched', () => {
    const source = lines(
      "import { panda } from '@panda/jsx'",
      'export const Btn = panda.button`color: ${(p) => p.color};`',
    )
    const result = tpl.transformSource({ path: 'src/btn.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { panda } from '@panda/jsx'
      export const Btn = panda.button\`color: \${(p) => p.color};\`"
    `)
  })

  test('desugars the definition but leaves component usage untouched', () => {
    const source = lines(
      "import { panda } from '@panda/jsx'",
      'const Box = panda.div`color: red;`',
      'export const el = <Box />',
    )
    const result = tpl.transformSource({ path: 'src/box.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      import { panda } from '@panda/jsx'
      const Box = panda.div(__pcva({ base: 'color_red' }))
      export const el = <Box />"
    `)
  })
})
