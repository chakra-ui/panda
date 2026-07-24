import { describe, expect, test } from 'vitest'
import { createTransformProject, importMap, lines } from '../test-utils'

// Config recipes + slot recipe, default (eager) compound mode. The design
// system's `<Card>`/`<Tabs>` ship from `@acme/ui`, mapped into the jsx importMap
// so Panda owns those tags (recipe components aren't exported from `@panda/jsx`).
//   - `button`   : size/variant variants, boolean `block`, one compound, defaults, `className: 'button'`
//   - `card`     : boolean `raised` + `visual` variants, `jsx: ['Card']`, `className: 'card'`
//   - `badge`    : two compound variants, defaults, no `className` (falls back to recipe key)
//   - `tabs`     : slot recipe (root/trigger), `jsx: ['Tabs']`, `className: 'tabs'`
const recipeCompiler = createTransformProject({
  importMap: { ...importMap, jsx: ['@panda/jsx', '@acme/ui'] },
  theme: {
    recipes: {
      button: {
        className: 'button',
        base: { display: 'inline-flex' },
        defaultVariants: { size: 'md', variant: 'solid' },
        variants: {
          size: { sm: { fontSize: '12px' }, md: { fontSize: '16px' }, lg: { fontSize: '18px' } },
          variant: { solid: { color: 'white' }, outline: { color: 'blue' } },
          block: { true: { display: 'flex' } },
        },
        compoundVariants: [{ size: 'sm', variant: 'outline', css: { padding: '2px' } }],
      },
      card: {
        className: 'card',
        jsx: ['Card'],
        base: { display: 'block' },
        variants: {
          raised: { true: { boxShadow: 'md' }, false: { boxShadow: 'none' } },
          visual: { fill: { color: 'white' }, outline: { color: 'blue' } },
        },
      },
      badge: {
        base: { display: 'inline-block' },
        defaultVariants: { size: 'sm', raised: false },
        variants: {
          size: { sm: { fontSize: '12px' }, md: { fontSize: '16px' }, lg: { fontSize: '18px' } },
          raised: { true: { boxShadow: 'md' }, false: { boxShadow: 'none' } },
        },
        compoundVariants: [
          { size: 'sm', raised: true, css: { color: 'white' } },
          { size: 'md', raised: true, css: { color: 'blue' } },
        ],
      },
    },
    slotRecipes: {
      tabs: {
        className: 'tabs',
        jsx: ['Tabs'],
        slots: ['root', 'trigger'],
        base: { root: { display: 'flex' }, trigger: { cursor: 'pointer' } },
        variants: {
          size: {
            sm: { root: { padding: '2px' }, trigger: { padding: '1px' } },
          },
        },
      },
    },
  },
  utilities: {
    display: { className: 'd' },
    fontSize: { className: 'fs' },
    color: {},
    backgroundColor: {},
    padding: {},
    cursor: {},
    boxShadow: {},
    border: {},
    fontWeight: {},
    margin: {},
  },
})

// Same `badge` recipe, but with `smartCompoundVariants` opt-in. Only affects
// which compound CSS is *emitted*, not the class names a static call resolves to.
const smartCompiler = createTransformProject({
  optimize: { smartCompoundVariants: true },
  theme: {
    recipes: {
      badge: {
        base: { display: 'inline-block' },
        defaultVariants: { size: 'sm', raised: false },
        variants: {
          size: { sm: { fontSize: '12px' }, md: { fontSize: '16px' }, lg: { fontSize: '18px' } },
          raised: { true: { boxShadow: 'md' }, false: { boxShadow: 'none' } },
        },
        compoundVariants: [
          { size: 'sm', raised: true, css: { color: 'white' } },
          { size: 'md', raised: true, css: { color: 'blue' } },
        ],
      },
    },
  },
  utilities: {
    display: { className: 'd' },
    fontSize: { className: 'fs' },
    color: {},
    boxShadow: {},
  },
})

// A `button` recipe under `prefix` + `hash` config, to document how class-name
// prefixing / hashing flows (or doesn't) through the recipe-call rewrite.
const prefixCompiler = createTransformProject({
  prefix: 'pd',
  hash: { className: true },
  theme: {
    recipes: {
      button: {
        className: 'button',
        base: { display: 'inline-flex' },
        defaultVariants: { size: 'md' },
        variants: {
          size: { sm: { fontSize: '12px' }, md: { fontSize: '16px' } },
          variant: { solid: { color: 'white' }, outline: { color: 'blue' } },
        },
        compoundVariants: [{ size: 'sm', variant: 'outline', css: { padding: '2px' } }],
      },
    },
  },
  utilities: {
    display: { className: 'd' },
    fontSize: { className: 'fs' },
    color: {},
    padding: {},
  },
})

describe('compiler.transformSource: config recipe calls', () => {
  test('inlines a config recipe compound class only when the combination matches', () => {
    const source = lines(
      "import { button } from '@panda/recipes'",
      "export const cls = button({ size: 'sm', variant: 'outline' })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const cls = "button button--size_sm button--variant_outline button--compound__size_sm__variant_outline""`,
    )
  })

  test('omits a config recipe compound class when the combination does not match in eager mode', () => {
    const source = lines(
      "import { button } from '@panda/recipes'",
      "export const cls = button({ size: 'lg', variant: 'outline' })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "button button--size_lg button--variant_outline""`)
  })

  test('applies default variants for a single explicit variant', () => {
    const source = lines("import { button } from '@panda/recipes'", "export const cls = button({ size: 'sm' })")

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "button button--size_sm button--variant_solid""`)
  })

  test('selects multiple variants in one call', () => {
    const source = lines(
      "import { button } from '@panda/recipes'",
      "export const cls = button({ size: 'lg', variant: 'outline' })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "button button--size_lg button--variant_outline""`)
  })

  test('applies all default variants for a no-arg call', () => {
    const source = lines("import { button } from '@panda/recipes'", 'export const cls = button()')

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "button button--size_md button--variant_solid""`)
  })

  test('applies all default variants for an empty-object call', () => {
    const source = lines("import { button } from '@panda/recipes'", 'export const cls = button({})')

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "button button--size_md button--variant_solid""`)
  })

  test('overrides a single default variant', () => {
    const source = lines("import { button } from '@panda/recipes'", "export const cls = button({ variant: 'outline' })")

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "button button--size_md button--variant_outline""`)
  })

  test('applies a boolean variant set to true', () => {
    const source = lines("import { button } from '@panda/recipes'", 'export const cls = button({ block: true })')

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const cls = "button button--block_true button--size_md button--variant_solid""`,
    )
  })

  test('applies a boolean variant on a recipe without default variants', () => {
    const source = lines("import { card } from '@panda/recipes'", 'export const cls = card({ raised: true })')

    const result = recipeCompiler.transformSource({ path: 'src/card.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "card card--raised_true""`)
  })

  test('uses the recipe key as class name when no className is configured', () => {
    const source = lines(
      "import { badge } from '@panda/recipes'",
      "export const cls = badge({ size: 'sm', raised: true })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/badge.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const cls = "badge badge--raised_true badge--size_sm badge--compound__raised_true__size_sm""`,
    )
  })

  test('includes only the matching compound among several', () => {
    const source = lines(
      "import { badge } from '@panda/recipes'",
      "export const cls = badge({ size: 'md', raised: true })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/badge.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const cls = "badge badge--raised_true badge--size_md badge--compound__raised_true__size_md""`,
    )
  })

  test('omits all compounds when the boolean side does not match', () => {
    const source = lines(
      "import { badge } from '@panda/recipes'",
      "export const cls = badge({ size: 'sm', raised: false })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/badge.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "badge badge--raised_false badge--size_sm""`)
  })

  test('rewrites two recipe calls in one file', () => {
    const source = lines(
      "import { button } from '@panda/recipes'",
      "export const small = button({ size: 'sm' })",
      "export const large = button({ size: 'lg' })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const small = "button button--size_sm button--variant_solid"
      export const large = "button button--size_lg button--variant_solid""
    `)
  })

  test('leaves an unknown recipe import unchanged', () => {
    const source = lines("import { missing } from '@panda/recipes'", "export const cls = missing({ size: 'sm' })")

    const result = recipeCompiler.transformSource({ path: 'src/missing.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { missing } from '@panda/recipes'
      export const cls = missing({ size: 'sm' })"
    `)
  })

  test('leaves a dynamic variant value unchanged', () => {
    const source = lines("import { button } from '@panda/recipes'", 'export const cls = button({ size: props.size })')

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { button } from '@panda/recipes'
      export const cls = button({ size: props.size })"
    `)
  })

  test('leaves a slot recipe call to the runtime', () => {
    const source = lines("import { tabs } from '@panda/recipes'", "export const cls = tabs({ size: 'sm' })")

    const result = recipeCompiler.transformSource({ path: 'src/tabs.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { tabs } from '@panda/recipes'
      export const cls = tabs({ size: 'sm' })"
    `)
  })

  test('handles a namespace member recipe call', () => {
    const source = lines(
      "import * as recipes from '@panda/recipes'",
      "export const cls = recipes.button({ size: 'sm' })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "button button--size_sm button--variant_solid""`)
  })

  // SUSPECT: a ternary variant value is inlined as an *unconditional union* of
  // both branch classes (both `size_sm` and `size_lg`), rather than bailing or
  // emitting a conditional expression. At runtime the call would apply only one
  // size class based on `isSmall`; emitting both makes size non-deterministic.
  test('inlines both branches of a ternary variant value (suspect union)', () => {
    const source = lines(
      "import { button } from '@panda/recipes'",
      "export const cls = button({ size: isSmall ? 'sm' : 'lg' })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.changed).toBe(true)
    expect(result.code).toMatchInlineSnapshot(
      `"export const cls = "button button--size_sm button--size_lg button--variant_solid""`,
    )
  })

  test('applies compound only when defaults are overridden into the combo', () => {
    // size defaults to md; explicitly select sm+outline to trip the compound.
    const source = lines(
      "import { button } from '@panda/recipes'",
      "export const a = button({ variant: 'outline' })",
      "export const b = button({ size: 'sm', variant: 'outline' })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const a = "button button--size_md button--variant_outline"
      export const b = "button button--size_sm button--variant_outline button--compound__size_sm__variant_outline""
    `)
  })
})

describe('compiler.transformSource: smartCompoundVariants recipe calls', () => {
  test('resolves the same class names as eager mode for a matching combo', () => {
    const source = lines(
      "import { badge } from '@panda/recipes'",
      "export const cls = badge({ size: 'sm', raised: true })",
    )

    const result = smartCompiler.transformSource({ path: 'src/badge.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const cls = "badge badge--raised_true badge--size_sm badge--compound__raised_true__size_sm""`,
    )
  })

  test('omits the compound class for a non-matching combo', () => {
    const source = lines(
      "import { badge } from '@panda/recipes'",
      "export const cls = badge({ size: 'lg', raised: true })",
    )

    const result = smartCompiler.transformSource({ path: 'src/badge.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "badge badge--raised_true badge--size_lg""`)
  })
})

describe('compiler.transformSource: recipe calls under prefix/hash config', () => {
  test('rewrites a prefixed + hashed recipe call', () => {
    const source = lines("import { button } from '@panda/recipes'", "export const cls = button({ size: 'sm' })")

    const result = prefixCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "button button--size_sm""`)
  })

  // SUSPECT: under `hash.className: true`, the compound class is hashed
  // (`button--efyQHr`) but the base (`button`) and variant classes
  // (`button--size_sm`, `button--variant_outline`) are left unhashed. The
  // `prefix: 'pd'` also never reaches any recipe class name. Base/variant and
  // compound class names should hash consistently.
  test('rewrites a prefixed + hashed compound recipe call (inconsistent hashing)', () => {
    const source = lines(
      "import { button } from '@panda/recipes'",
      "export const cls = button({ size: 'sm', variant: 'outline' })",
    )

    const result = prefixCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const cls = "button button--size_sm button--variant_outline button--efyQHr""`,
    )
  })
})

describe('compiler.transformSource: inline cva / sva / styled', () => {
  test('rewrites inline cva to the internal string-branch config', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      'export const button = cva({',
      "  base: { color: 'red', backgroundColor: 'blue' },",
      '  variants: {',
      "    size: { sm: { fontSize: '12px' }, md: { fontSize: '16px' } },",
      '  },',
      "  defaultVariants: { size: 'md' },",
      '})',
    )

    const result = recipeCompiler.transformSource({ path: 'src/recipes.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      export const button = __pcva({ base: 'background-color_blue color_red', variants: { size: { sm: 'fs_12px', md: 'fs_16px' } }, defaultVariants: { size: 'md' } })"
    `)
  })

  test('rewrites inline cva with only a base', () => {
    const source = lines("import { cva } from '@panda/css'", "export const button = cva({ base: { color: 'red' } })")

    const result = recipeCompiler.transformSource({ path: 'src/recipes.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      export const button = __pcva({ base: 'color_red' })"
    `)
  })

  test('rewrites inline cva with compound + default variants', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      'export const button = cva({',
      "  base: { color: 'white' },",
      '  variants: {',
      "    size: { sm: { fontSize: '12px' } },",
      "    intent: { danger: { backgroundColor: 'red' } },",
      '  },',
      "  compoundVariants: [{ size: 'sm', intent: 'danger', css: { color: 'black' } }],",
      "  defaultVariants: { size: 'sm', intent: 'danger' },",
      '})',
    )

    const result = recipeCompiler.transformSource({ path: 'src/recipes.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      export const button = __pcva({ base: 'color_white', variants: { size: { sm: 'fs_12px' }, intent: { danger: 'background-color_red' } }, defaultVariants: { size: 'sm', intent: 'danger' }, compoundVariants: [{ size: 'sm', intent: 'danger', css: 'color_black' }] })"
    `)
  })

  test('rewrites inline sva to the internal string-branch config', () => {
    const source = lines(
      "import { sva } from '@panda/css'",
      'export const tabs = sva({',
      "  slots: ['root', 'trigger'],",
      "  base: { root: { display: 'flex' }, trigger: { cursor: 'pointer' } },",
      '  variants: {',
      "    size: { sm: { root: { fontSize: '12px' }, trigger: { fontSize: '12px' } } },",
      '  },',
      '})',
    )

    const result = recipeCompiler.transformSource({ path: 'src/recipes.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { sva as __psva } from '@pandacss-internal/css';
      export const tabs = __psva({ slots: ['root', 'trigger'], base: { root: 'd_flex', trigger: 'cursor_pointer' }, variants: { size: { sm: 'fs_12px' } } })"
    `)
  })

  test('rewrites a styled factory with a full recipe config', () => {
    const source = lines(
      "import { styled } from '@panda/jsx'",
      "export const Panel = styled('div', {",
      "  base: { color: 'red', padding: '8px' },",
      '  variants: {',
      "    size: { sm: { fontSize: '12px' }, md: { fontSize: '16px' } },",
      '  },',
      "  defaultVariants: { size: 'md' },",
      '})',
    )

    const result = recipeCompiler.transformSource({ path: 'src/panel.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva } from '@pandacss-internal/css';
      import { styled } from '@panda/jsx'
      export const Panel = styled('div', __pcva({ base: 'color_red padding_8px', variants: { size: { sm: 'fs_12px', md: 'fs_16px' } }, defaultVariants: { size: 'md' } }))"
    `)
  })

  test('bails on a cva.raw member call', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      "export const button = cva.raw({ base: { color: 'red' } })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/recipes.ts', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva } from '@panda/css'
      export const button = cva.raw({ base: { color: 'red' } })"
    `)
  })

  test('bails on an sva.raw member call', () => {
    const source = lines(
      "import { sva } from '@panda/css'",
      "export const tabs = sva.raw({ base: { root: { display: 'flex' } } })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/recipes.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { sva } from '@panda/css'
      export const tabs = sva.raw({ base: { root: { display: 'flex' } } })"
    `)
  })

  test('bails on a dynamic cva base value', () => {
    const source = lines(
      "import { cva } from '@panda/css'",
      'export const button = cva({ base: { color: props.color } })',
    )

    const result = recipeCompiler.transformSource({ path: 'src/recipes.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva } from '@panda/css'
      export const button = cva({ base: { color: props.color } })"
    `)
  })

  test('injects both cva and sva symbols in a single internal import', () => {
    const source = lines(
      "import { cva, sva } from '@panda/css'",
      "export const button = cva({ base: { color: 'red' } })",
      "export const tabs = sva({ base: { root: { display: 'flex' } } })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/recipes.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { cva as __pcva, sva as __psva } from '@pandacss-internal/css';
      export const button = __pcva({ base: 'color_red' })
      export const tabs = __psva({ slots: ['root'], base: { root: 'd_flex' } })"
    `)
  })
})

describe('compiler.transformSource: recipe JSX components', () => {
  test('rewrites a config recipe JSX element with a boolean variant', () => {
    const source = lines("import { Card } from '@acme/ui'", 'export const el = <Card raised />')

    const result = recipeCompiler.transformSource({ path: 'src/card.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className="card card--raised_true" />"`)
  })

  test('splits recipe variant props from style props on a JSX element', () => {
    const source = lines(
      "import { Card } from '@acme/ui'",
      'export const el = <Card raised visual="outline" color="red" />',
    )

    const result = recipeCompiler.transformSource({ path: 'src/card.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className="card card--raised_true card--visual_outline color_red" />"`,
    )
  })

  test('leaves a slot recipe JSX element for the runtime', () => {
    const source = lines("import { Tabs } from '@acme/ui'", 'export const el = <Tabs size="sm" />')

    const result = recipeCompiler.transformSource({ path: 'src/tabs.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { Tabs } from '@acme/ui'
      export const el = <Tabs size="sm" />"
    `)
  })
})
