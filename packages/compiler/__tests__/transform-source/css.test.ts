import { describe, expect, test } from 'vitest'
import { getBindingInfo } from '../../src'
import { createTransformProject, lines } from '../test-utils'

const compiler = createTransformProject({
  conditions: {
    hover: '&:hover',
    dark: '.dark &',
    focus: '&:focus',
    active: '&:active',
    groupHover: '.group:hover &',
    peerHover: '.peer:hover ~ &',
  },
  theme: {
    breakpoints: { sm: '640px', md: '768px', lg: '1024px' },
    tokens: { colors: { red: { 500: { value: '#ef4444' } } } },
  },
  utilities: {
    color: {},
    background: {},
    backgroundColor: {},
    borderColor: {},
    marginTop: {},
    margin: {},
    padding: {},
    paddingTop: {},
    display: {},
    fontWeight: {},
    fontSize: {},
    width: {},
    height: {},
    opacity: {},
    outline: {},
    content: {},
    zIndex: {},
  },
})

describe('compiler.transformSource: css', () => {
  test('native binding is loaded', () => {
    expect(getBindingInfo()).toMatchInlineSnapshot(`
      {
        "native": true,
      }
    `)
  })

  test('rewrites static css() calls to class strings', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', marginTop: '4px' })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({
      changed: result.changed,
      bailed: result.bailed,
      code: result.code,
    }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = "color_red margin-top_4px"",
      }
    `)
  })

  test('rewrites namespace css member calls', () => {
    const source = lines("import * as panda from '@panda/css'", "export const cls = panda.css({ color: 'red' })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const cls = "color_red""
    `)
  })

  test('splits a mixed static/dynamic css object into cx(static, runtime css)', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', marginTop: props.m })",
    )

    const result = compiler.transformSource({ path: 'src/styles.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cx as __pcx } from '@pandacss-internal/css';
      import { css } from '@panda/css'
      export const cls = __pcx("color_red", css({ marginTop: props.m }))"
    `)
  })

  test('leaves a css object with a nested partial dynamic prop untouched', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', _hover: { color: 'blue', padding: props.p } })",
    )

    const result = compiler.transformSource({ path: 'src/styles.tsx', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { css } from '@panda/css'
      export const cls = css({ color: 'red', _hover: { color: 'blue', padding: props.p } })",
      }
    `)
  })

  test('rewrites duplicate object keys using last value', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', padding: '4px', color: 'blue' })",
    )

    const result = compiler.transformSource({ path: 'src/styles.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const cls = "color_blue padding_4px""
    `)
  })

  test('rewrites css.raw static objects', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const raw = css.raw({ color: 'red', padding: '4px' })",
    )

    const result = compiler.transformSource({ path: 'src/styles.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const raw = "color_red padding_4px""
    `)
  })

  test('rewrites multiple static css() calls in one file', () => {
    const source = lines("import { css } from '@panda/css'", "css({ color: 'red' })", "css({ marginTop: '4px' })")

    const result = compiler.transformSource({ path: 'src/styles.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      ""color_red"
      "margin-top_4px""
    `)
  })

  test('rewrites mixed static and unextractable dynamic calls', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const staticCls = css({ color: 'red' })",
      'export const dynamicCls = css({ color: props.color })',
    )

    const result = compiler.transformSource({ path: 'src/mixed.tsx', source })
    expect({
      changed: result.changed,
      bailed: result.bailed,
      code: result.code,
    }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "import { css } from '@panda/css'
      export const staticCls = "color_red"
      export const dynamicCls = css({ color: props.color })",
      }
    `)
  })

  test('leaves unextractable dynamic css() calls untouched', () => {
    const source = lines("import { css } from '@panda/css'", 'export const cls = css({ color: props.color })')

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({
      changed: result.changed,
      bailed: result.bailed,
      code: result.code,
    }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "bailed": false,
        "code": "import { css } from '@panda/css'
      export const cls = css({ color: props.color })",
      }
    `)
  })

  test('rewrites finite conditional css values to a runtime ternary', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: isError ? 'red' : 'blue' })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({
      changed: result.changed,
      bailed: result.bailed,
      code: result.code,
    }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = isError ? "color_red" : "color_blue"",
      }
    `)
  })

  test('folds const-bound ternaries when the branch is static', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      'const dark = true',
      "export const cls = css({ color: dark ? 'red' : 'blue' })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "const dark = true
      export const cls = "color_red""
    `)
  })

  test('forwards transform target options to the native layer', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ color: 'red' })")

    const result = compiler.transformSource({
      path: 'src/button.tsx',
      source,
      targetsCss: false,
      targetsPatterns: true,
    })

    expect({
      changed: result.changed,
      bailed: result.bailed,
      code: result.code,
    }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "bailed": false,
        "code": "import { css } from '@panda/css'
      export const cls = css({ color: 'red' })",
      }
    `)
  })

  test('rewrites a condition (pseudo) prop to a prefixed class', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ _hover: { color: 'red' } })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "hover:color_red""`)
  })

  test('rewrites a responsive object value across breakpoints', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: { base: 'red', md: 'blue' } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_red md:color_blue""`)
  })

  test('rewrites a responsive array value across breakpoints', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ margin: ['1', '2'] })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "margin_1 sm:margin_2""`)
  })

  test('rewrites an important value', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ color: 'red!' })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_red!""`)
  })

  test('rewrites a numeric value', () => {
    const source = lines("import { css } from '@panda/css'", 'export const cls = css({ zIndex: 10 })')

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "z-index_10""`)
  })

  test('merges multiple css() args with last-wins per property', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', padding: '2' }, { color: 'blue' })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_blue padding_2""`)
  })

  test('keeps both shorthand and longhand atomic classes', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ padding: '2', paddingTop: '4' })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "padding_2 padding-top_4""`)
  })

  test('folds a resolvable static spread into the object', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const base = { color: 'red' }",
      "export const cls = css({ ...base, padding: '2' })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "const base = { color: 'red' }
      export const cls = "color_red padding_2""
    `)
  })

  test('leaves an empty css() object untouched', () => {
    const source = lines("import { css } from '@panda/css'", 'export const cls = css({})')

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { css } from '@panda/css'
      export const cls = css({})",
      }
    `)
  })

  test('splits multiple mixed static/dynamic calls in one file', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const a = css({ color: 'red', width: props.w })",
      "export const b = css({ padding: '2', marginTop: props.m })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cx as __pcx } from '@pandacss-internal/css';
      import { css } from '@panda/css'
      export const a = __pcx("color_red", css({ width: props.w }))
      export const b = __pcx("padding_2", css({ marginTop: props.m }))"
    `)
  })

  test('rewrites through an aliased css import', () => {
    const source = lines("import { css as c } from '@panda/css'", "export const cls = c({ color: 'red' })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_red""`)
  })

  test('flattens a doubly-nested condition block into a chained prefix', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ _hover: { _dark: { color: 'pink' } } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "hover:dark:color_pink""`)
  })

  test('spreads a base breakpoint block across its nested props', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ sm: { color: 'purple', padding: '4px' } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "sm:color_purple sm:padding_4px""`)
  })

  test('resolves multiple conditions listed on a single property', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: { base: 'red', _hover: 'blue', md: 'green' } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_red hover:color_blue md:color_green""`)
  })

  test('flattens a long property-level condition chain', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: { _hover: { md: { lg: 'red' } } } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "hover:md:lg:color_red""`)
  })

  test('resolves a group-hover condition block', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ _groupHover: { color: 'red' } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "groupHover:color_red""`)
  })

  test('resolves a peer-hover nested-dark condition block', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ _peerHover: { _dark: { color: 'white' } } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "peerHover:dark:color_white""`)
  })

  test('rewrites an arbitrary child-combinator selector key', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ '& > p': { color: 'red' } })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "[&_>_p]:color_red""`)
  })

  test('rewrites an arbitrary attribute selector key', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ '&[data-active]': { color: 'red' } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "[&[data-active]]:color_red""`)
  })

  test('rewrites an at-rule media key', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ '@media (min-width: 700px)': { color: 'red' } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "[@media_(min-width:_700px)]:color_red""`)
  })

  test('rewrites an arbitrary custom-property key', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ ['--foo']: 'bar' })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "--foo_bar""`)
  })

  test('rewrites an arbitrary bracketed value', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ width: '[100px]' })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "width_[100px]""`)
  })

  test('rewrites a negative value', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ marginTop: '-4px' })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "margin-top_-4px""`)
  })

  test('rewrites a content value with quotes without breaking the file', () => {
    const source = lines("import { css } from '@panda/css'", `export const cls = css({ content: '"x"' })`)

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "content_\\"x\\"""`)
  })

  test('flattens an array of style objects into merged classes', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css([{ color: 'red' }, { padding: '4px' }])",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_red padding_4px""`)
  })

  test('skips null and false entries in a css array', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css([null, false, { color: 'red' }])")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_red""`)
  })

  test('drops a null property value', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ color: 'red', padding: null })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = "color_red"",
      }
    `)
  })

  test('keeps an undefined property value as a runtime remainder', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', width: undefined })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "import { cx as __pcx } from '@pandacss-internal/css';
      import { css } from '@panda/css'
      export const cls = __pcx("color_red", css({ width: undefined }))",
      }
    `)
  })

  // NOTE: `false` currently emits a literal `margin_false` atomic class instead of
  // being dropped like `null`/`undefined`. See report — likely a bug.
  test('emits a class for a false property value (current behavior)', () => {
    const source = lines("import { css } from '@panda/css'", 'export const cls = css({ margin: false })')

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = "margin_false"",
      }
    `)
  })

  test('folds a logical-or value to its first truthy operand', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ color: 'red' || 'blue' })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = "color_red"",
      }
    `)
  })

  test('rewrites a logical-and spread to a conditional class expression', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', ...(unk && { padding: '1' }) })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = unk ? "color_red padding_1" : "color_red"",
      }
    `)
  })

  test('rewrites a same-key ternary spread to branch class strings', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', ...(unk ? { padding: '1' } : { padding: '2' }) })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const cls = unk ? "color_red padding_1" : "color_red padding_2""`,
    )
  })

  test('resolves a token-reference string value', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ color: 'red.500' })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_red.500""`)
  })

  test('rewrites css.raw with a responsive conditional object', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css.raw({ color: { base: 'red', md: 'blue' } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_red md:color_blue""`)
  })

  test('emits both classes for a multi-prop finite ternary', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: isError ? 'red' : 'blue', _hover: { color: isDark ? 'white' : 'black' } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const cls = (isError ? "color_red" : "color_blue") + " " + (isDark ? "hover:color_white" : "hover:color_black")"`,
    )
  })

  test('rewrites a whole-argument object ternary to branch class strings', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css(isPrimary ? { color: 'blue', _hover: { color: 'green' } } : { color: 'gray' })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const cls = isPrimary ? "color_blue hover:color_green" : "color_gray""`,
    )
  })

  test('leaves css() imported from an unrelated module untouched', () => {
    const source = lines("import { css } from 'other-lib'", "export const cls = css({ color: 'red' })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "bailed": false,
        "code": "import { css } from 'other-lib'
      export const cls = css({ color: 'red' })",
      }
    `)
  })

  test('leaves a bare css identifier with no import untouched', () => {
    const source = lines("export const cls = css({ color: 'red' })")

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "bailed": false,
        "code": "export const cls = css({ color: 'red' })",
      }
    `)
  })

  test('bails on a nested condition block mixing static and dynamic props', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ _hover: { _dark: { color: 'red', margin: props.m } } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "bailed": true,
        "code": "import { css } from '@panda/css'
      export const cls = css({ _hover: { _dark: { color: 'red', margin: props.m } } })",
      }
    `)
  })

  test('splits a top-level dynamic prop out of a static condition block', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ _hover: { color: 'red' }, width: props.w })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cx as __pcx } from '@pandacss-internal/css';
      import { css } from '@panda/css'
      export const cls = __pcx("hover:color_red", css({ width: props.w }))"
    `)
  })
})
