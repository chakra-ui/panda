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
    width: { className: 'width', shorthand: 'w' },
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

  describe('conditional argument merging', () => {
    test('keeps static styles after a conditional first argument', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        "  { padding: '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = (state.a ? "color_red" : "color_blue") + " " + "padding_4px""`,
      )
    })

    test('keeps static styles before a conditional last argument', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { padding: '4px' },",
        "  { color: state.a ? 'red' : 'blue' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = "padding_4px" + " " + (state.a ? "color_red" : "color_blue")"`,
      )
    })

    test('lets the last conditional argument win for the same property', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        "  { color: state.b ? 'green' : 'pink' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = state.a ? (state.b ? "color_green" : "color_pink") : state.b ? "color_green" : "color_pink""`,
      )
    })

    test('keeps evaluating a condition overwritten by a static argument', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        "  { color: 'green', padding: '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = state.a ? "color_green padding_4px" : "color_green padding_4px""`,
      )
    })

    test('preserves override order across three arguments', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        "  { padding: state.b ? '4px' : '2px' },",
        "  { color: 'green' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = "color_green" + " " + (state.a ? (state.b ? "padding_4px" : "padding_2px") : state.b ? "padding_4px" : "padding_2px")"`,
      )
    })

    test('preserves numeric argument order when there are more than ten arguments', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  state.a ? { color: 'red' } : { color: 'blue' },",
        "  { color: 'green' },",
        "  { color: 'green' },",
        "  { color: 'green' },",
        "  { color: 'green' },",
        "  { color: 'green' },",
        "  { color: 'green' },",
        "  { color: 'green' },",
        "  { color: 'green' },",
        "  { color: 'green' },",
        "  { color: 'green' },",
        "  { color: 'green' },",
        "  { color: 'pink' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`"const cls = state.a ? "color_pink" : "color_pink""`)
    })
  })

  describe('conditional object arguments', () => {
    test('merges a whole-object branch before a static override', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  state.a ? { color: 'red', padding: '4px' } : { color: 'blue' },",
        "  { color: 'green' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`"const cls = state.a ? "color_green padding_4px" : "color_green""`)
    })

    test('keeps earlier properties absent from a later object branch', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: 'red' },",
        "  state.a ? { color: 'blue' } : { padding: '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`"const cls = state.a ? "color_blue" : "color_red padding_4px""`)
    })

    test('merges a logical whole-object argument when truthy', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { padding: '2px' },",
        "  state.a && { padding: '4px' },",
        "  { color: state.b ? 'red' : 'blue' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = state.a ? (state.b ? "color_red padding_4px" : "color_blue padding_4px") : state.b ? "color_red padding_2px" : "color_blue padding_2px""`,
      )
    })

    test('ignores null and false arguments', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        '  null,',
        "  { color: state.a ? 'red' : 'blue' },",
        '  false,',
        "  { padding: '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = state.a ? "color_red padding_4px" : "color_blue padding_4px""`,
      )
    })

    test('keeps later styles when an object branch is empty', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  state.a ? {} : { color: 'red' },",
        "  { padding: '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`"const cls = (state.a ? "" : "color_red") + " " + "padding_4px""`)
    })

    test('evaluates a logical argument only in the selected branch', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  state.a ? (state.b && { color: 'red' }) : { color: 'blue' },",
        "  { padding: '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = (state.a ? (state.b ? "color_red" : "") : "color_blue") + " " + "padding_4px""`,
      )
    })

    test('lowers conditional arrays of style objects', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  state.a ? [{ color: state.b ? 'red' : 'blue' }, { padding: '2px' }] : [{ padding: '4px' }],",
        "  { color: 'green' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = state.a ? (state.b ? "color_green padding_2px" : "color_green padding_2px") : "color_green padding_4px""`,
      )
    })
  })

  describe('nested styles and spreads', () => {
    test('merges hover declarations across arguments', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { _hover: { color: state.a ? 'red' : 'blue', padding: '4px' } },",
        "  { _hover: { color: state.b ? 'green' : 'pink' } },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = "hover:padding_4px" + " " + (state.a ? (state.b ? "hover:color_green" : "hover:color_pink") : state.b ? "hover:color_green" : "hover:color_pink")"`,
      )
    })

    test('lets later arguments override conditional spread values', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: 'red', ...(state.a ? { padding: '4px' } : { padding: '2px' }) },",
        "  { padding: state.b ? '8px' : '6px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = "color_red" + " " + (state.a ? (state.b ? "padding_8px" : "padding_6px") : state.b ? "padding_8px" : "padding_6px")"`,
      )
    })

    test('lowers conditional responsive array slots', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { padding: [state.a ? '4px' : '2px', '8px'] },",
        "  { color: state.b ? 'red' : 'blue' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = (state.a ? "padding_4px sm:padding_8px" : "padding_2px sm:padding_8px") + " " + (state.b ? "color_red" : "color_blue")"`,
      )
    })

    test('preserves nested value-ternary evaluation', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? (state.b ? 'red' : 'green') : 'blue' },",
        "  { padding: '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = (state.a ? (state.b ? "color_red" : "color_green") : "color_blue") + " " + "padding_4px""`,
      )
    })

    test('lowers conditional properties inside whole-object branches', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  state.a ? { color: state.b ? 'red' : 'green' } : { color: 'blue' },",
        "  { padding: '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = (state.a ? (state.b ? "color_red" : "color_green") : "color_blue") + " " + "padding_4px""`,
      )
    })

    test('keeps base styles when a spread branch omits them', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { padding: '2px', ...(state.a ? { padding: '4px' } : {}) },",
        "  { color: state.b ? 'red' : 'blue' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = (state.a ? "padding_4px" : "padding_2px") + " " + (state.b ? "color_red" : "color_blue")"`,
      )
    })

    test('keeps base styles when a logical spread is falsy', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { padding: '2px', ...(state.a && { padding: '4px' }) },",
        "  { color: state.b ? 'red' : 'blue' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = (state.a ? "padding_4px" : "padding_2px") + " " + (state.b ? "color_red" : "color_blue")"`,
      )
    })
  })

  describe('runtime preservation', () => {
    test('keeps property-level logical values whose falsy result is unknown', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { padding: state.a && '4px' },",
        "  { color: state.b ? 'red' : 'blue' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`
        "import { cx as __pcx } from '@pandacss-internal/css';
        import { css } from '@panda/css'
        const cls = __pcx(css({ padding: state.a && '4px' }), state.b ? "color_red" : "color_blue")"
      `)
    })

    test('keeps a dynamic value in the last argument', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        '  { width: props.width },',
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`
        "import { cx as __pcx } from '@pandacss-internal/css';
        import { css } from '@panda/css'
        const cls = __pcx(state.a ? "color_red" : "color_blue", css({ width: props.width }))"
      `)
    })

    test('keeps a dynamic value in the first argument', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        '  { width: props.width },',
        "  { color: state.a ? 'red' : 'blue' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`
        "import { cx as __pcx } from '@pandacss-internal/css';
        import { css } from '@panda/css'
        const cls = __pcx(css({ width: props.width }), state.a ? "color_red" : "color_blue")"
      `)
    })

    test('keeps an open spread in a later argument', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        '  { ...props },',
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(false)
      expect(result.code).toMatchInlineSnapshot(`
        "import { css } from '@panda/css'
        const cls = css(
          { color: state.a ? 'red' : 'blue' },
          { ...props },
        )"
      `)
    })

    test('keeps an entirely open later argument', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        '  props,',
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(false)
      expect(result.code).toMatchInlineSnapshot(`
        "import { css } from '@panda/css'
        const cls = css(
          { color: state.a ? 'red' : 'blue' },
          props,
        )"
      `)
    })

    test('keeps a dynamic logical fallback', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        "  { width: props.width || '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`
        "import { cx as __pcx } from '@pandacss-internal/css';
        import { css } from '@panda/css'
        const cls = __pcx(state.a ? "color_red" : "color_blue", css({ width: props.width || '4px' }))"
      `)
    })

    test('keeps a dynamic nullish fallback', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        "  { width: props.width ?? '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`
        "import { cx as __pcx } from '@pandacss-internal/css';
        import { css } from '@panda/css'
        const cls = __pcx(state.a ? "color_red" : "color_blue", css({ width: props.width ?? '4px' }))"
      `)
    })

    test('keeps a nested dynamic hover value', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        '  { _hover: { width: props.width } },',
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`
        "import { cx as __pcx } from '@pandacss-internal/css';
        import { css } from '@panda/css'
        const cls = __pcx(state.a ? "color_red" : "color_blue", css({ _hover: { width: props.width } }))"
      `)
    })

    test('keeps unknown responsive array slots', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { color: state.a ? 'red' : 'blue' },",
        "  { padding: ['4px', props.padding] },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(`
        "import { cx as __pcx } from '@pandacss-internal/css';
        import { css } from '@panda/css'
        const cls = __pcx(state.a ? "color_red" : "color_blue", css({ padding: ['4px', props.padding] }))"
      `)
    })

    test('lowers nested conditions inside a finite spread branch', () => {
      const source = lines(
        "import { css } from '@panda/css'",
        'const cls = css(',
        "  { ...(state.a ? { color: state.b ? 'red' : 'blue' } : {}) },",
        "  { padding: '4px' },",
        ')',
      )
      const result = compiler.transformSource({ path: 'src/conditional.ts', source })
      expect(result.changed).toBe(true)
      expect(result.code).toMatchInlineSnapshot(
        `"const cls = (state.a ? (state.b ? "color_red" : "color_blue") : "") + " " + "padding_4px""`,
      )
    })
  })

  test('lowers interacting conditions at the 16-leaf budget', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ color: a ? 'red' : 'blue' }, { color: b ? 'red' : 'blue' }, { color: c ? 'red' : 'blue' }, { color: d ? 'red' : 'blue' })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(
      `"const cls = a ? (b ? (c ? (d ? "color_red" : "color_blue") : d ? "color_red" : "color_blue") : c ? (d ? "color_red" : "color_blue") : d ? "color_red" : "color_blue") : b ? (c ? (d ? "color_red" : "color_blue") : d ? "color_red" : "color_blue") : c ? (d ? "color_red" : "color_blue") : d ? "color_red" : "color_blue""`,
    )
  })

  test('lets a null declaration remove an earlier argument value', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ color: 'red', padding: '4px' }, { color: state.ready ? 'blue' : null })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"const cls = state.ready ? "color_blue padding_4px" : "padding_4px""`)
  })

  test('lets a scalar condition override remove an earlier subtree', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ _hover: { color: 'red' }, padding: '4px' }, { _hover: state.ready ? { color: 'blue' } : null })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(
      `"const cls = state.ready ? "padding_4px hover:color_blue" : "padding_4px""`,
    )
  })

  test('lowers arguments whose final merged style is empty', () => {
    const source = lines("import { css } from '@panda/css'", "const cls = css({ color: 'red' }, { color: null })")
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`"const cls = """`)
  })

  test('keeps nested spread reads that later properties override', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ ...(state.a ? { color: state.b ? 'red' : 'blue' } : {}), color: 'green' }, { padding: '4px' })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      const cls = css({ ...(state.a ? { color: state.b ? 'red' : 'blue' } : {}), color: 'green' }, { padding: '4px' })"
    `)
  })

  test('keeps whole-object unions without a local branch expression at runtime', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "function render(styles: { color: 'red' } | { color: 'blue' }) { return css(styles) }",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      function render(styles: { color: 'red' } | { color: 'blue' }) { return css(styles) }"
    `)
  })

  test('keeps oversized interacting conditions at runtime', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ color: a ? 'red' : 'blue' }, { color: b ? 'red' : 'blue' }, { color: c ? 'red' : 'blue' }, { color: d ? 'red' : 'blue' }, { color: e ? 'red' : 'blue' })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      const cls = css({ color: a ? 'red' : 'blue' }, { color: b ? 'red' : 'blue' }, { color: c ? 'red' : 'blue' }, { color: d ? 'red' : 'blue' }, { color: e ? 'red' : 'blue' })"
    `)
  })

  test('keeps shorthand conflicts between finite and runtime arguments', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ width: state.ready ? '4px' : '8px' }, { w: props.width })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      const cls = css({ width: state.ready ? '4px' : '8px' }, { w: props.width })"
    `)
  })

  test('keeps condition conflicts across equivalent object shapes', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ _hover: { color: state.ready ? 'red' : 'blue' } }, { color: { _hover: props.color } })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      const cls = css({ _hover: { color: state.ready ? 'red' : 'blue' } }, { color: { _hover: props.color } })"
    `)
  })

  test('keeps responsive conflicts with unknown array slots', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ sm: { padding: state.ready ? '4px' : '8px' } }, { padding: ['2px', props.padding] })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      const cls = css({ sm: { padding: state.ready ? '4px' : '8px' } }, { padding: ['2px', props.padding] })"
    `)
  })

  test('preserves runtime argument order when a nested scope is revisited', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ color: 'red', _hover: { width: props.first } }, { _dark: { height: props.second } }, { _hover: { padding: props.third } })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cx as __pcx } from '@pandacss-internal/css';
      import { css } from '@panda/css'
      const cls = __pcx("color_red", css({ _hover: { width: props.first } }, { _dark: { height: props.second } }, { _hover: { padding: props.third } }))"
    `)
  })

  test('preserves interleaved conditional and dynamic property reads', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ width: props.first, color: state.ready ? 'red' : 'blue', height: props.last })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cx as __pcx } from '@pandacss-internal/css';
      import { css } from '@panda/css'
      const cls = __pcx(css({ width: props.first }), state.ready ? "color_red" : "color_blue", css({ height: props.last }))"
    `)
  })

  test('keeps mixed objects with folded spreads whose property provenance is lost', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ width: props.first, ...{ width: '4px' }, height: props.last })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      const cls = css({ width: props.first, ...{ width: '4px' }, height: props.last })"
    `)
  })

  test('keeps scalar condition overrides alongside runtime subtrees', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ color: 'red', _hover: null }, { _hover: { width: props.width } })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      const cls = css({ color: 'red', _hover: null }, { _hover: { width: props.width } })"
    `)
  })

  test('lowers independent conditions in one large object', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ color: a ? 'red' : 'blue', padding: b ? '4px' : '8px', width: c ? '4px' : '8px', height: d ? '4px' : '8px', margin: e ? '4px' : '8px' })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(
      `"const cls = (a ? "color_red" : "color_blue") + " " + (b ? "padding_4px" : "padding_8px") + " " + (c ? "width_4px" : "width_8px") + " " + (d ? "height_4px" : "height_8px") + " " + (e ? "margin_4px" : "margin_8px")"`,
    )
  })

  test('lowers a nested spread branch while retaining its base fallback', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ color: 'green', ...(state.a ? { color: state.b ? 'red' : 'blue' } : {}) }, { padding: '4px' })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(
      `"const cls = (state.a ? (state.b ? "color_red" : "color_blue") : "color_green") + " " + "padding_4px""`,
    )
  })

  test('keeps helper-disabled partial calls at runtime', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ color: state.ready ? 'red' : 'blue' }, { width: props.width })",
    )
    const result = compiler.transformSource({ path: 'src/edge.ts', source, helperCx: 'false' })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { css } from '@panda/css'
      const cls = css({ color: state.ready ? 'red' : 'blue' }, { width: props.width })"
    `)
  })

  test('preserves condition order when an earlier read can throw', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ color: state.a ? 'red' : 'red' }, { padding: state.b ? '4px' : '4px' })",
    )
    const result = compiler.transformSource({ path: 'src/conditional.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(
      `"const cls = (state.a ? "color_red" : "color_red") + " " + (state.b ? "padding_4px" : "padding_4px")"`,
    )
  })

  test('lowers four independent conditional arguments', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      'const cls = css(',
      "  { color: flags[0] ? '1px' : '2px' },",
      "  { padding: flags[1] ? '1px' : '2px' },",
      "  { width: flags[2] ? '1px' : '2px' },",
      "  { height: flags[3] ? '1px' : '2px' },",
      ')',
    )
    const result = compiler.transformSource({ path: 'src/conditional.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(
      `"const cls = (flags[0] ? "color_1px" : "color_2px") + " " + (flags[1] ? "padding_1px" : "padding_2px") + " " + (flags[2] ? "width_1px" : "width_2px") + " " + (flags[3] ? "height_1px" : "height_2px")"`,
    )
  })

  test('lowers independent conditions beyond the combination budget', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      'const cls = css(',
      "  { color: flags[0] ? '1px' : '2px' },",
      "  { padding: flags[1] ? '1px' : '2px' },",
      "  { width: flags[2] ? '1px' : '2px' },",
      "  { height: flags[3] ? '1px' : '2px' },",
      "  { margin: flags[4] ? '1px' : '2px' },",
      ')',
    )
    const result = compiler.transformSource({ path: 'src/conditional.ts', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(
      `"const cls = (flags[0] ? "color_1px" : "color_2px") + " " + (flags[1] ? "padding_1px" : "padding_2px") + " " + (flags[2] ? "width_1px" : "width_2px") + " " + (flags[3] ? "height_1px" : "height_2px") + " " + (flags[4] ? "margin_1px" : "margin_2px")"`,
    )
  })

  test('preserves member reads when conditional arms share all classes', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "const cls = css({ color: state.ready ? 'red' : 'red', padding: other.ready ? '4px' : '4px' })",
    )
    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(
      `"const cls = (state.ready ? "color_red" : "color_red") + " " + (other.ready ? "padding_4px" : "padding_4px")"`,
    )
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

  test('splits nested static and dynamic styles', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', _hover: { color: 'blue', padding: props.p } })",
    )

    const result = compiler.transformSource({ path: 'src/styles.tsx', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "code": "import { cx as __pcx } from '@pandacss-internal/css';
      import { css } from '@panda/css'
      export const cls = __pcx("color_red hover:color_blue", css({ _hover: { padding: props.p } }))",
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
    expect(result.code).toMatchInlineSnapshot(`"export const raw = { color: 'red', padding: '4px' }"`)
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

  test('lowers an empty css() object to an empty class string', () => {
    const source = lines("import { css } from '@panda/css'", 'export const cls = css({})')

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "code": "export const cls = """,
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
        "code": "export const cls = "color_red"",
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
    expect(result.code).toMatchInlineSnapshot(`"export const cls = { color: { base: 'red', md: 'blue' } }"`)
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

  test('splits deeply nested static and dynamic styles', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ _hover: { _dark: { color: 'red', margin: props.m } } })",
    )

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "import { cx as __pcx } from '@pandacss-internal/css';
      import { css } from '@panda/css'
      export const cls = __pcx("hover:dark:color_red", css({ _hover: { _dark: { margin: props.m } } }))",
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
