import { describe, expect, it } from 'vitest'
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
  it('renders a styled component whose config was specialized', async () => {
    const { attachesRecipe, original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { styled } from '@panda/jsx'",
        "export { render } from 'react'",
        "const Button = styled('button', {",
        "  base: { bg: 'red', fontSize: '14px' },",
        "  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },",
        "  defaultVariants: { size: 'sm' },",
        '})',
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

  it('merges style props over a specialized styled config through raw', async () => {
    const { original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { styled } from '@panda/jsx'",
        "export { render } from 'react'",
        "const Button = styled('button', {",
        "  base: { bg: 'red' },",
        "  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },",
        "  defaultVariants: { size: 'sm' },",
        '})',
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

  it('extends a specialized styled component with styled()', async () => {
    const { original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { styled } from '@panda/jsx'",
        "export { render } from 'react'",
        "const Base = styled('div', {",
        "  base: { bg: 'red' },",
        "  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },",
        "  defaultVariants: { size: 'sm' },",
        '})',
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

  it('lets the child base win over a parent variant when extending with styled()', async () => {
    const { original, transformed } = await load(
      [
        "import { createElement } from 'react'",
        "import { styled } from '@panda/jsx'",
        "export { render } from 'react'",
        "const Base = styled('div', {",
        "  variants: { size: { sm: { fontSize: '12px' } } },",
        "  defaultVariants: { size: 'sm' },",
        '})',
        "const Card = styled(Base, { base: { fontSize: '14px' } })",
        'export const card = createElement(Card, {})',
      ].join('\n'),
    )

    expect({ original: render(original, 'card'), transformed: render(transformed, 'card') }).toMatchInlineSnapshot(`
      {
        "original": {
          "children": undefined,
          "className": "fs_12px",
          "type": "div",
        },
        "transformed": {
          "children": undefined,
          "className": "fs_14px",
          "type": "div",
        },
      }
    `)
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
})
