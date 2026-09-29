import { describe, expect, it } from 'vitest'
import { createCompiler } from '@pandacss/compiler'
import { createSourceTransformer } from '../src'
import { createFixtureCompiler, run } from './fixtures/styled-system'

/** Run `source` untransformed and transformed through the real generated styled-system runtime. */
async function load(source: string) {
  const compiler = createFixtureCompiler()
  const result = createSourceTransformer(compiler).transformSource({ path: 'src/app.tsx', source })
  return {
    attachesRecipe: result.helper.needsAttachRecipe,
    original: await run(compiler, source),
    transformed: await run(compiler, result.code),
  }
}

/** Atomic class order carries no meaning, so compare class sets. */
function normalize(node: any): any {
  if (Array.isArray(node)) return node.map(normalize)
  if (!node || typeof node !== 'object') return node
  const className = typeof node.className === 'string' ? node.className.split(' ').sort().join(' ') : node.className
  return { ...node, className, children: normalize(node.children) }
}

function render(exports: Record<string, any>, name: string) {
  return normalize(exports.render(exports[name]))
}

describe('transformed recipes inside the styled-system runtime', () => {
  it('renders a styled component built from a transformed cva', async () => {
    const { attachesRecipe, original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { styled } from '@panda/jsx'",
        "import { cva } from '@panda/css'",
        "export { render } from 'react'",
        'const button = cva({',
        "  base: { bg: 'red', fontSize: '14px' },",
        "  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },",
        "  defaultVariants: { size: 'sm' },",
        '})',
        "const Button = styled('button', button)",
        'export const plain = createElement(Button, {})',
        "export const large = createElement(Button, { size: 'lg' })",
      ].join('\n'),
    )

    expect(attachesRecipe).toBe(true)
    expect(render(transformed, 'plain')).toEqual(render(original, 'plain'))
    expect(render(transformed, 'large')).toEqual(render(original, 'large'))
    expect(render(transformed, 'large')).toMatchInlineSnapshot(`
      {
        "children": undefined,
        "className": "bg_red fs_16px",
        "type": "button",
      }
    `)
  })

  it('merges style props over a transformed cva through raw', async () => {
    const { original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { styled } from '@panda/jsx'",
        "import { cva } from '@panda/css'",
        "export { render } from 'react'",
        'const button = cva({',
        "  base: { bg: 'red' },",
        "  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },",
        "  defaultVariants: { size: 'sm' },",
        '})',
        "const Button = styled('button', button)",
        "export const overridden = createElement(Button, { size: 'lg', bg: 'blue' })",
      ].join('\n'),
    )

    expect(render(transformed, 'overridden')).toEqual(render(original, 'overridden'))
    expect(render(transformed, 'overridden')).toMatchInlineSnapshot(`
      {
        "children": undefined,
        "className": "bg_blue fs_16px",
        "type": "button",
      }
    `)
  })

  it('extends a styled component built from a transformed cva with styled()', async () => {
    const { original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { styled } from '@panda/jsx'",
        "import { cva } from '@panda/css'",
        "export { render } from 'react'",
        'const base = cva({',
        "  base: { bg: 'red' },",
        "  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },",
        "  defaultVariants: { size: 'sm' },",
        '})',
        "const Base = styled('div', base)",
        "const Card = styled(Base, { base: { borderRadius: 'xl' }, variants: { size: { lg: { bg: 'blue' } } } })",
        'export const small = createElement(Card, {})',
        "export const large = createElement(Card, { size: 'lg' })",
        "export const styledLarge = createElement(Card, { size: 'lg', fontSize: '20px' })",
      ].join('\n'),
    )

    expect(render(transformed, 'small')).toEqual(render(original, 'small'))
    expect(render(transformed, 'large')).toEqual(render(original, 'large'))
    expect(render(transformed, 'styledLarge')).toEqual(render(original, 'styledLarge'))
    expect(render(transformed, 'large')).toMatchInlineSnapshot(`
      {
        "children": undefined,
        "className": "bdr_xl bg_blue fs_16px",
        "type": "div",
      }
    `)
  })

  it('keeps styled-system precedence when a child base overlaps a parent variant', async () => {
    const { original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { styled } from '@panda/jsx'",
        "import { cva } from '@panda/css'",
        "export { render } from 'react'",
        'const base = cva({',
        "  variants: { size: { sm: { fontSize: '12px' } } },",
        "  defaultVariants: { size: 'sm' },",
        '})',
        "const Base = styled('div', base)",
        "const Card = styled(Base, { base: { fontSize: '14px' } })",
        'export const card = createElement(Card, {})',
        "export const styled14 = createElement(Card, { bg: 'red' })",
      ].join('\n'),
    )

    expect(render(transformed, 'card')).toEqual(render(original, 'card'))
    expect(render(transformed, 'styled14')).toEqual(render(original, 'styled14'))
    expect(render(transformed, 'card')).toMatchInlineSnapshot(`
      {
        "children": undefined,
        "className": "fs_12px",
        "type": "div",
      }
    `)
  })

  it('leaves a literal styled config to styled-system', async () => {
    const { attachesRecipe, original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { styled } from '@panda/jsx'",
        "export { render } from 'react'",
        "const Button = styled('button', {",
        "  base: { bg: 'red' },",
        "  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },",
        '})',
        "export const large = createElement(Button, { size: 'lg', bg: 'blue' })",
      ].join('\n'),
    )

    expect(attachesRecipe).toBe(false)
    expect(render(transformed, 'large')).toEqual(render(original, 'large'))
  })

  it('uses an exported specialized cva as the child of an untransformed styled component', async () => {
    const { original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { styled } from '@panda/jsx'",
        "import { cva } from '@panda/css'",
        "export { render } from 'react'",
        "const tone = globalThis.__tone ?? 'red'",
        "const Base = styled('div', { base: { bg: tone } })",
        'export const badge = cva({',
        "  base: { borderRadius: 'xl' },",
        "  variants: { size: { lg: { fontSize: '16px' } } },",
        '})',
        'const Badge = styled(Base, badge)',
        "export const large = createElement(Badge, { size: 'lg' })",
      ].join('\n'),
    )

    expect(render(transformed, 'large')).toEqual(render(original, 'large'))
    expect(render(transformed, 'large')).toMatchInlineSnapshot(`
      {
        "children": undefined,
        "className": "bdr_xl bg_red fs_16px",
        "type": "div",
      }
    `)
  })

  it('renders slot components from a specialized sva through createSlotRecipeContext', async () => {
    const { attachesRecipe, original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { createSlotRecipeContext } from '@panda/jsx'",
        "import { sva } from '@panda/css'",
        "export { render } from 'react'",
        'export const tabs = sva({',
        "  slots: ['root', 'trigger'],",
        "  base: { root: { bg: 'red' }, trigger: { borderRadius: 'xl' } },",
        "  variants: { size: { sm: { trigger: { fontSize: '12px' } } } },",
        '})',
        'const { withProvider, withContext } = createSlotRecipeContext(tabs)',
        "const Root = withProvider('div', 'root')",
        "const Trigger = withContext('button', 'trigger')",
        "export const tree = createElement(Root, { size: 'sm' }, createElement(Trigger, {}))",
      ].join('\n'),
    )

    expect(attachesRecipe).toBe(true)
    expect(render(transformed, 'tree')).toEqual(render(original, 'tree'))
    expect(render(transformed, 'tree')).toMatchInlineSnapshot(`
      {
        "children": {
          "children": undefined,
          "className": "bdr_xl fs_12px",
          "type": "button",
        },
        "className": "bg_red",
        "type": "div",
      }
    `)
  })

  it('composes an exported specialized recipe with css() through raw', async () => {
    const source = [
      "import { cva, sva } from '@panda/css'",
      "export { css } from '@styled-system/css'",
      'export const button = cva({',
      "  base: { bg: 'red' },",
      "  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },",
      "  compoundVariants: [{ size: 'lg', css: { borderRadius: 'xl' } }],",
      "  defaultVariants: { size: 'sm' },",
      '})',
      'export const tabs = sva({',
      "  slots: ['root', 'trigger'],",
      "  base: { root: { bg: 'red' } },",
      "  variants: { size: { sm: { trigger: { fontSize: '12px' } } } },",
      '})',
    ].join('\n')
    const { original, transformed } = await load(source)

    expect(transformed.css(transformed.button.raw({ size: 'lg' }), { bg: 'blue' })).toBe(
      original.css(original.button.raw({ size: 'lg' }), { bg: 'blue' }),
    )
    expect(transformed.css(transformed.tabs.raw({ size: 'sm' }).trigger)).toBe(
      original.css(original.tabs.raw({ size: 'sm' }).trigger),
    )
  })

  it('keeps shorthands as written in raw, unlike the normalized styled-system raw', async () => {
    const { original, transformed } = await load(
      [
        "import { cva } from '@panda/css'",
        "export const button = cva({ base: { bg: 'red' }, variants: { size: { lg: { fontSize: '16px' } } } })",
      ].join('\n'),
    )

    expect({
      original: original.button.raw({ size: 'lg' }),
      transformed: transformed.button.raw({ size: 'lg' }),
    }).toMatchInlineSnapshot(`
      {
        "original": {
          "backgroundColor": "red",
          "fontSize": "16px",
        },
        "transformed": {
          "bg": "red",
          "fontSize": "16px",
        },
      }
    `)
  })

  it('treats a null props object like no props, as styled-system does', async () => {
    const { original, transformed } = await load(
      [
        "import { cva, sva } from '@panda/css'",
        'const config = {',
        "  base: { bg: 'red' },",
        "  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },",
        "  compoundVariants: [{ size: 'lg', css: { bg: 'blue' } }],",
        "  defaultVariants: { size: 'lg' },",
        '}',
        'export const button = cva(config)',
        'const local = cva(config)',
        'export const called = (props) => local(props)',
        'const tabs = sva({',
        "  slots: ['root', 'trigger'],",
        "  base: { root: { bg: 'red' } },",
        "  variants: { size: { sm: { trigger: { fontSize: '12px' } }, lg: { trigger: { fontSize: '16px' } } } },",
        "  defaultVariants: { size: 'lg' },",
        '})',
        'export const slots = (props) => tabs(props)',
      ].join('\n'),
    )

    const results = (exports: Record<string, any>) => ({
      exported: exports.button(null),
      called: exports.called(null),
      slots: exports.slots(null),
    })
    expect(results(transformed)).toEqual(results(original))
    expect(results(transformed)).toMatchInlineSnapshot(`
      {
        "called": "bg_blue fs_16px",
        "exported": "bg_blue fs_16px",
        "slots": {
          "root": "bg_red",
          "trigger": "fs_16px",
        },
      }
    `)
  })
})

describe('transformed styles in a project without presets', () => {
  it('returns the class names styled-system builds without utilities', async () => {
    const compiler = createCompiler({
      cwd: '/virtual',
      outdir: 'styled-system',
      outExtension: 'mjs',
      importMap: { css: ['@panda/css'] },
    })
    const source = [
      "import { css, cva, sva } from '@panda/css'",
      "export const plain = css({ color: 'red.100', marginTop: '4px' })",
      "export const important = css({ color: 'red !important' })",
      "const button = cva({ base: { display: 'flex' }, variants: { size: { lg: { paddingInline: '2px' } } } })",
      "export const large = button({ size: 'lg' })",
      "const tabs = sva({ slots: ['root'], base: { root: { gap: '2px' } } })",
      'export const slots = tabs()',
    ].join('\n')
    const result = createSourceTransformer(compiler).transformSource({ path: 'src/app.tsx', source })
    const pick = ({ plain, important, large, slots }: Record<string, any>) => ({ plain, important, large, slots })

    const transformed = pick(await run(compiler, result.code))
    expect(transformed).toEqual(pick(await run(compiler, source)))
    expect(result.code).toMatchInlineSnapshot(`
      "import { cx as __pcx, memoRecipe as __pm } from '@pandacss-internal/css';
      export const plain = "color_red.100 margin-top_4px"
      export const important = "color_red!"
      const button = /* @__PURE__ */ __pm((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('display_flex', { lg: "padding-inline_2px" }[v0]); }, { size: ["lg"] })
      export const large = button({ size: 'lg' })
      const tabs = (p = {}) => ({ root: "gap_2px" })
      export const slots = tabs()"
    `)
    expect(transformed).toMatchInlineSnapshot(`
      {
        "important": "color_red!",
        "large": "display_flex padding-inline_2px",
        "plain": "color_red.100 margin-top_4px",
        "slots": {
          "root": "gap_2px",
        },
      }
    `)
  })

  it('folds raw selectors and at-rules to the classes styled-system and the stylesheet use', async () => {
    const compiler = createCompiler({
      cwd: '/virtual',
      outdir: 'styled-system',
      outExtension: 'mjs',
      importMap: { css: ['@panda/css'] },
    })
    const source = [
      "import { css } from '@panda/css'",
      "export const hover = css({ '&:hover': { color: 'red' } })",
      "export const attribute = css({ '[data-state=open] &': { color: 'red' } })",
      "export const parent = css({ '.dark &': { color: 'red' } })",
      "export const media = css({ '@media (min-width: 768px)': { '&:hover': { color: 'red' } } })",
      "export const supports = css({ '@supports (display: grid)': { display: 'grid' } })",
      "export const propertyLevel = css({ color: { base: 'red', '&:hover': 'blue' } })",
    ].join('\n')
    const result = createSourceTransformer(compiler).transformSource({ path: 'src/app.tsx', source })
    const pick = ({ hover, attribute, parent, media, supports, propertyLevel }: Record<string, any>) => ({
      hover,
      attribute,
      parent,
      media,
      supports,
      propertyLevel,
    })

    const transformed = pick(await run(compiler, result.code))
    expect(transformed).toEqual(pick(await run(compiler, source)))
    expect(result.code).toMatchInlineSnapshot(`
      "export const hover = "[&:hover]:color_red"
      export const attribute = "[[data-state=open]_&]:color_red"
      export const parent = "[.dark_&]:color_red"
      export const media = "[@media_(min-width:_768px)]:[&:hover]:color_red"
      export const supports = "[@supports_(display:_grid)]:display_grid"
      export const propertyLevel = "color_red [&:hover]:color_blue""
    `)
  })
})
