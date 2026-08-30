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
    expect(isCssProperty('id')).toBe(false)

    const [style, rest] = splitCssProps({
      display: 'flex',
      _hover: { color: 'red.500' },
      id: 'box',
    })

    expect(style).toEqual({ display: 'flex', _hover: { color: 'red.500' } })
    expect(rest).toEqual({ id: 'box' })
  })
})
