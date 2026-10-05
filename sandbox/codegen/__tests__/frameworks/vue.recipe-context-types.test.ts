import { describe, expectTypeOf, test } from 'vitest'
import { cva } from '../../styled-system-vue/css'
import { createRecipeContext, createSlotRecipeContext } from '../../styled-system-vue/jsx'
import { button, slotButton } from '../../styled-system-vue/recipes'

type PropsOf<T> = T extends (props: infer P, ...rest: never[]) => unknown ? P : never

describe('recipe context types - vue', () => {
  test('a config recipe types the variant props of a context component', () => {
    const { withContext } = createRecipeContext(button)
    const Button = withContext('button')
    type Visual = NonNullable<PropsOf<typeof Button>['visual']>

    expectTypeOf<'outline'>().toMatchTypeOf<Visual>()
    expectTypeOf<'nope'>().not.toMatchTypeOf<Visual>()
  })

  test('a cva recipe types the props context', () => {
    const badge = cva({ variants: { tone: { info: {}, danger: {} } } })
    const { usePropsContext } = createRecipeContext(badge)
    type Tone = NonNullable<NonNullable<ReturnType<typeof usePropsContext>>['tone']>

    expectTypeOf<'info'>().toMatchTypeOf<Tone>()
    expectTypeOf<'nope'>().not.toMatchTypeOf<Tone>()
  })

  test('a hand-written runtime recipe types its variant props from __type', () => {
    const chip = Object.assign((_props?: { size?: 'sm' | 'lg' }) => 'chip', {
      __type: {} as { size?: 'sm' | 'lg' },
    })
    const { withContext } = createRecipeContext(chip)
    const Chip = withContext('span')
    type Size = NonNullable<PropsOf<typeof Chip>['size']>

    expectTypeOf<'sm'>().toMatchTypeOf<Size>()
    expectTypeOf<'xl'>().not.toMatchTypeOf<Size>()
  })

  test('a slot recipe types slot names and variant props', () => {
    const { withProvider } = createSlotRecipeContext(slotButton)
    const Root = withProvider('div', 'root')
    type Visual = NonNullable<PropsOf<typeof Root>['visual']>

    expectTypeOf<'outline'>().toMatchTypeOf<Visual>()
    expectTypeOf<'nope'>().not.toMatchTypeOf<Visual>()
    // @ts-expect-error unknown slot
    withProvider('div', 'nope')
  })
})
