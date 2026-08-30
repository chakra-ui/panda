import { describe, expect, it } from 'vitest'
import { loadGeneratedModule } from './generated-runtime'
import { createProject } from './test-utils'

type IsValidPropRuntime = {
  isCssProperty: (value: string) => boolean
  splitCssProps: (props: Record<string, unknown>) => [Record<string, unknown>, Record<string, unknown>]
}

describe('generated is-valid-prop', () => {
  it('treats condition props as style props so they are not forwarded', async () => {
    const compiler = createProject({
      outExtension: 'mjs',
      conditions: {
        hover: '&:hover',
        dark: '.dark &',
      },
      utilities: {
        color: { className: 'c' },
        display: { className: 'd' },
      },
    })

    const { isCssProperty, splitCssProps } = await loadGeneratedModule<IsValidPropRuntime>(compiler, {
      entry: 'jsx/is-valid-prop.mjs',
    })

    expect(isCssProperty('_hover')).toBe(true)
    expect(isCssProperty('_dark')).toBe(true)
    expect(isCssProperty('--foo')).toBe(true)
    expect(isCssProperty('&:hover')).toBe(true)
    expect(isCssProperty('@media (width >= 48rem)')).toBe(true)
    expect(isCssProperty('id')).toBe(false)

    const [style, rest] = splitCssProps({
      display: 'flex',
      _hover: { color: 'red.500' },
      '--foo': 42,
      '&:hover': { color: 'red.500' },
      id: 'box',
    })

    expect(style).toEqual({
      display: 'flex',
      _hover: { color: 'red.500' },
      '--foo': 42,
      '&:hover': { color: 'red.500' },
    })
    expect(rest).toEqual({ id: 'box' })
  })

  it('treats composition and theme condition keys as style props', async () => {
    const compiler = createProject({
      outExtension: 'mjs',
      themes: {
        primary: {},
      },
      theme: {
        textStyles: {
          body: { value: { fontSize: '16px' } },
        },
        layerStyles: {
          card: { value: { background: 'white' } },
        },
        animationStyles: {
          fade: { value: { animationDuration: '200ms' } },
        },
      },
    })

    const { isCssProperty } = await loadGeneratedModule<IsValidPropRuntime>(compiler, {
      entry: 'jsx/is-valid-prop.mjs',
    })

    expect(isCssProperty('textStyle')).toBe(true)
    expect(isCssProperty('layerStyle')).toBe(true)
    expect(isCssProperty('animationStyle')).toBe(true)
    expect(isCssProperty('_themePrimary')).toBe(true)
  })
})
