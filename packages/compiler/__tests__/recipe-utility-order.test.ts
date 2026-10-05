import { describe, expect, it } from 'vitest'
import { createCompilerFromSnapshot } from '../src'
import { importMap } from './test-utils'

function createLayout(
  base: Record<string, unknown>,
  theme: { recipes?: Record<string, unknown>; [key: string]: unknown } = {},
  options: Record<string, unknown> = {},
) {
  return createCompilerFromSnapshot(
    {
      config: {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap,
        conditions: { hover: '&:hover', icon: '& > svg' },
        theme: { ...theme, recipes: { layout: { className: 'layout', base }, ...theme?.recipes } },
        utilities: {
          stack: { className: 'stack', transform: { kind: 'js-callback', id: 'stack' } },
          display: { className: 'd', shorthand: 'd' },
          hoverStack: { transform: { kind: 'js-callback', id: 'hoverStack' } },
          hoverDisplay: { transform: { kind: 'js-callback', id: 'hoverDisplay' } },
        },
        ...options,
      },
      callbacks: {
        'utility.transform': {
          stack: (value) => (value ? { display: 'flex' } : {}),
          hoverStack: () => ({ _hover: { display: 'flex' }, cursor: 'pointer' }),
          hoverDisplay: (value) => ({ _hover: { display: value } }),
        },
      },
    },
    { crossFile: false },
  )
}

function recipeCss(compiler: ReturnType<typeof createLayout>, source = 'layout()') {
  compiler.parseFileSource('/virtual/layout.ts', `import { layout, slots } from '@panda/recipes'; ${source}`)
  return compiler.getLayerCss({ layers: ['recipes'] }).css
}

function declarations(css: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = [...css.matchAll(new RegExp(`${escaped}\\s*\\{([^{}]*)\\}`, 'g'))]
  expect(matches, `missing CSS rule ${selector}`).toHaveLength(1)
  return matches[0][1]
    .trim()
    .split(/\s*;\s*/)
    .filter(Boolean)
}

describe('recipe utility order', () => {
  it('keeps a repeated value when it is authored again after a conflicting utility', () => {
    const css = recipeCss(createLayout({ display: 'grid', stack: true, d: 'grid' }))
    expect(declarations(css, '.layout')).toEqual(['display: grid'])
  })
  it.each(['block', 'grid', 'inline-flex', 'none'])('lets display: %s override an earlier stack utility', (value) => {
    expect(declarations(recipeCss(createLayout({ stack: true, display: value })), '.layout')).toEqual([
      `display: ${value}`,
    ])
  })

  it.each(['block', 'grid', 'inline-flex', 'none'])('lets a later stack utility override display: %s', (value) => {
    expect(declarations(recipeCss(createLayout({ display: value, stack: true })), '.layout')).toEqual(['display: flex'])
  })

  it('keeps base and variant precedence independent', () => {
    const compiler = createLayout(
      { display: 'grid', stack: true },
      {
        recipes: {
          layout: {
            className: 'layout',
            base: { display: 'grid', stack: true },
            variants: { display: { block: { stack: true, display: 'block' } } },
          },
        },
      },
    )
    const css = recipeCss(compiler, "layout({ display: 'block' })")
    expect(declarations(css, '.layout')).toEqual(['display: flex'])
    expect(declarations(css, '.layout--display_block')).toEqual(['display: block'])
  })

  it('resolves condition-first and property-first shapes in authored order', () => {
    const compiler = createLayout({
      _hover: { stack: true },
      display: { _hover: 'block', base: 'grid' },
      '@media (width >= 48rem)': { stack: true, display: 'none' },
      _icon: { display: 'grid', stack: true },
    })
    const css = recipeCss(compiler)
    expect(declarations(css, '.layout:hover')).toEqual(['display: block'])
    expect(declarations(css, '.layout > svg')).toEqual(['display: flex'])
    expect(css).toContain('@media (width >= 48rem)')
    expect(css).toContain('display: none;')
    expect(css).toContain('display: grid;')
  })

  it.each([
    [{ hoverStack: true, hoverDisplay: 'block' }, 'block'],
    [{ hoverDisplay: 'grid', hoverStack: true }, 'flex'],
  ])('resolves hover layout utilities in authored order: %j', (style, expected) => {
    const css = recipeCss(createLayout(style))
    expect(declarations(css, '.layout:hover')).toEqual([`display: ${expected}`])
    expect(declarations(css, '.layout')).toEqual(['cursor: pointer'])
  })

  it('keeps important display even when stack comes later', () => {
    const css = recipeCss(createLayout({ display: 'block !important', stack: true }))
    expect(declarations(css, '.layout')).toEqual(['display: block !important'])
  })

  it('lets an important stack override an earlier normal display', () => {
    const css = recipeCss(createLayout({ display: 'grid', stack: 'true !important' }))
    expect(declarations(css, '.layout')).toEqual(['display: flex !important'])
  })

  it('lets the later display win when both values are important', () => {
    const css = recipeCss(createLayout({ stack: 'true !important', display: 'block !important' }))
    expect(declarations(css, '.layout')).toEqual(['display: block !important'])
  })

  it('keeps explicit display when stack is disabled', () => {
    expect(declarations(recipeCss(createLayout({ display: 'block', stack: false })), '.layout')).toEqual([
      'display: block',
    ])
  })

  it('lets a layout style written after display override it', () => {
    const compiler = createLayout(
      { display: 'block', layerStyle: 'column' },
      { layerStyles: { column: { value: { stack: true } } } },
    )
    expect(declarations(recipeCss(compiler), '.layout')).toEqual(['display: flex'])
  })

  it('lets display written after a layout style override it', () => {
    const compiler = createLayout(
      { layerStyle: 'column', display: 'block' },
      { layerStyles: { column: { value: { stack: true } } } },
    )
    expect(declarations(recipeCss(compiler), '.layout')).toEqual(['display: block'])
  })

  it('lets display override stack inside a named layout style', () => {
    const compiler = createLayout(
      { layerStyle: 'column' },
      {
        layerStyles: { column: { value: { stack: true, display: 'block' } } },
      },
    )
    expect(declarations(recipeCss(compiler), '.layout')).toEqual(['display: block'])
  })

  it('preserves the winning fallback run', () => {
    const compiler = createLayout({ stack: true, display: 'firstThatWorks(grid, block)' })
    expect(declarations(recipeCss(compiler), '.layout')).toEqual(['display: block', 'display: grid'])
  })

  it('resolves each slot, variant, and compound independently', () => {
    const compiler = createLayout(
      {},
      {
        slotRecipes: {
          slots: {
            className: 'slots',
            slots: ['root', 'label'],
            base: { root: { stack: true, display: 'block' }, label: { display: 'grid', stack: true } },
            variants: {
              display: {
                block: {
                  root: { display: 'block', stack: true },
                  label: { stack: true, display: 'grid' },
                },
              },
            },
            compoundVariants: [
              {
                display: 'block',
                css: {
                  root: { stack: true, display: 'inline-flex' },
                  label: { display: 'none', stack: true },
                },
              },
            ],
          },
        },
      },
    )
    const css = recipeCss(compiler, "slots({ display: 'block' })")
    expect(declarations(css, '.slots__root')).toEqual(['display: block'])
    expect(declarations(css, '.slots__label')).toEqual(['display: flex'])
    expect(declarations(css, '.slots__root--display_block')).toEqual(['display: flex'])
    expect(declarations(css, '.slots__label--display_block')).toEqual(['display: grid'])
    expect(declarations(css, '.slots__root--compound__display_block')).toEqual(['display: inline-flex'])
    expect(declarations(css, '.slots__label--compound__display_block')).toEqual(['display: flex'])
  })

  it('lets the later compound clause win when both target the same variant', () => {
    const compiler = createLayout(
      {},
      {
        recipes: {
          layout: {
            className: 'layout',
            variants: { size: { sm: {} } },
            compoundVariants: [
              { size: 'sm', css: { cursor: 'pointer', display: 'block' } },
              { size: 'sm', css: { display: 'grid' } },
            ],
          },
        },
      },
    )
    const css = recipeCss(compiler, "layout({ size: 'sm' })")
    expect(declarations(css, '.layout--compound__size_sm')).toEqual(['cursor: pointer', 'display: grid'])
    compiler.parseFileSource('/virtual/other.ts', "import { layout } from '@panda/recipes'; layout({ size: 'sm' })")
    compiler.parseFileSource('/virtual/layout.ts', 'export const unused = true')
    expect(declarations(compiler.getLayerCss({ layers: ['recipes'] }).css, '.layout--compound__size_sm')).toEqual([
      'cursor: pointer',
      'display: grid',
    ])
  })

  it('preserves order when removing and re-adding a recipe usage', () => {
    const compiler = createLayout({ stack: true, display: 'block' })
    const before = recipeCss(compiler)
    compiler.parseFileSource('/virtual/layout.ts', 'export const unused = true')
    expect(compiler.getLayerCss({ layers: ['recipes'] }).css).not.toContain('.layout')
    expect(recipeCss(compiler)).toBe(before)
    expect(declarations(before, '.layout')).toEqual(['display: block'])
  })

  it.each([
    ['sm', 'lg'],
    ['lg', 'sm'],
  ])('keeps shared compound classes stable when files are visited as %s then %s', (first, second) => {
    const compiler = createLayout(
      {},
      {
        recipes: {
          layout: {
            variants: { size: { sm: {}, lg: {} } },
            compoundVariants: [
              { size: 'sm', className: 'shared-layout', css: { cursor: 'pointer', display: 'block' } },
              { size: 'lg', className: 'shared-layout', css: { stack: true } },
            ],
          },
        },
      },
      { optimize: { smartCompoundVariants: true } },
    )
    for (const size of [first, second]) {
      compiler.parseFileSource(
        `/virtual/${size}.ts`,
        `import { layout } from '@panda/recipes'; layout({ size: '${size}' })`,
      )
    }
    expect(declarations(compiler.getLayerCss({ layers: ['recipes'] }).css, '.shared-layout')).toEqual([
      'cursor: pointer',
      'display: flex',
    ])
    compiler.parseFileSource('/virtual/lg.ts', 'export const unused = true')
    expect(declarations(compiler.getLayerCss({ layers: ['recipes'] }).css, '.shared-layout')).toEqual([
      'cursor: pointer',
      'display: block',
    ])
  })

  it('preserves recipe precedence through a build-info round trip', () => {
    const library = createLayout({ stack: true, display: 'block' })
    const expected = recipeCss(library)
    expect(declarations(expected, '.layout')).toEqual(['display: block'])
    const info = JSON.parse(JSON.stringify(library.buildInfo.create({ panda: '^2.0.0' })))
    const consumer = createLayout({})
    expect(consumer.buildInfo.hydrate(info, { name: '@acme/layout' }).ok).toBe(true)
    expect(consumer.getLayerCss({ layers: ['recipes'] }).css).toBe(expected)
  })

  it('keeps utility order when static CSS adds an unused recipe variant', () => {
    const compiler = createLayout(
      {},
      {
        recipes: {
          layout: {
            className: 'layout',
            variants: {
              size: {
                sm: { display: 'grid', stack: true },
                lg: { stack: true, display: 'grid' },
              },
            },
          },
        },
      },
      { staticCss: { recipes: { layout: ['*'] } } },
    )
    const css = recipeCss(compiler, "layout({ size: 'sm' })")
    expect(declarations(css, '.layout--size_sm')).toEqual(['display: flex'])
    expect(declarations(css, '.layout--size_lg')).toEqual(['display: grid'])
  })
})
