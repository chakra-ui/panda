/** @jsxImportSource solid-js */
import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'
import { createSlotRecipeContext } from '../../styled-system-solid/jsx'
import { slotButton } from '../../styled-system-solid/recipes'
import { sva } from '../../styled-system-solid/css'

const { withProvider, withContext } = createSlotRecipeContext(slotButton)

const Root = withProvider('div', 'root')
const Icon = withProvider('span', 'icon')
const Label = withContext('span', 'root')

describe('style context - solid', () => {
  test('context slots inherit the root variant, a nested provider slot does not', () => {
    const { container } = render(() => (
      <Root visual="outline">
        <Icon>Icon</Icon>
        <Label>Click me</Label>
      </Root>
    ))

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_outline"
        data-slot="root"
      >
        <span
          class="slot-button__icon slot-button__icon--visual_unstyled"
          data-slot="icon"
        >
          Icon
        </span>
        <span
          class="slot-button__root slot-button__root--visual_outline"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('a context slot inherits the variant from its provider', () => {
    const { container } = render(() => (
      <Root visual="solid">
        <Label>Click me</Label>
      </Root>
    ))

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
        data-slot="root"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('default props as object', () => {
    const RootWithDefaults = withProvider('div', 'root', { defaultProps: { 'data-testid': 'button-root' } })

    const { container } = render(() => (
      <RootWithDefaults visual="solid">
        <Label>Click me</Label>
      </RootWithDefaults>
    ))

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
        data-slot="root"
        data-testid="button-root"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('default props as function', () => {
    const RootWithFunctionDefaults = withProvider('div', 'root', {
      defaultProps: () => ({
        'data-testid': 'button-root-function',
        'data-framework': 'solid',
      }),
    })

    const { container } = render(() => (
      <RootWithFunctionDefaults visual="solid">
        <Label>Click me</Label>
      </RootWithFunctionDefaults>
    ))

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
        data-framework="solid"
        data-slot="root"
        data-testid="button-root-function"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('context default props as function can provide children', () => {
    const LabelWithDefaults = withContext('span', 'root', {
      defaultProps: () => ({
        class: 'fallback-label',
        children: <em>Default label</em>,
      }),
    })

    const { container } = render(() => (
      <Root visual="solid">
        <LabelWithDefaults />
      </Root>
    ))

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
        data-slot="root"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid fallback-label"
          data-slot="root"
        >
          <em>
            Default label
          </em>
        </span>
      </div>
    `)
  })

  test('forwardProps exposes the variant to the component', () => {
    const RootWithForward = withProvider('div', 'root', { forwardProps: ['visual'] })

    const { container } = render(() => <RootWithForward visual="outline" />)

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_outline"
        data-slot="root"
        visual="outline"
      />
    `)
  })

  test('forwardProps stays reactive', () => {
    const [visual, setVisual] = createSignal<'outline' | 'solid'>('outline')
    const RootWithForward = withProvider('div', 'root', { forwardProps: ['visual'] })

    const { container } = render(() => <RootWithForward visual={visual()} />)
    const div = () => container.firstChild as HTMLElement

    expect(div().getAttribute('visual')).toBe('outline')

    setVisual('solid')
    expect(div().getAttribute('visual')).toBe('solid')
  })
})

describe('style context defaultProps', () => {
  test('an undefined prop keeps its default on withRootProvider', () => {
    const { withRootProvider } = createSlotRecipeContext(slotButton)
    const RootWithDefaults = withRootProvider((props: Record<string, unknown>) => <div {...props} />, {
      defaultProps: { 'aria-label': 'Close' },
    })

    const { container } = render(() => <RootWithDefaults aria-label={undefined}>Close</RootWithDefaults>)

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        aria-label="Close"
      >
        Close
      </div>
    `)
  })

  test('an undefined prop keeps its default on withProvider and withContext', () => {
    const RootWithDefaults = withProvider('div', 'root', { defaultProps: { 'aria-label': 'Close' } })
    const LabelWithDefaults = withContext('span', 'root', { defaultProps: { 'aria-label': 'Label' } })

    const { container } = render(() => (
      <RootWithDefaults aria-label={undefined}>
        <LabelWithDefaults aria-label={undefined}>Close</LabelWithDefaults>
      </RootWithDefaults>
    ))

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        aria-label="Close"
        class="slot-button__root slot-button__root--visual_unstyled"
        data-slot="root"
      >
        <span
          aria-label="Label"
          class="slot-button__root slot-button__root--visual_unstyled"
          data-slot="root"
        >
          Close
        </span>
      </div>
    `)
  })
})

describe('style context PropsProvider', () => {
  test('PropsProvider sets variants and props on withProvider', () => {
    const { withProvider, withContext, PropsProvider } = createSlotRecipeContext(slotButton)
    const ButtonRoot = withProvider('div', 'root')
    const ButtonLabel = withContext('span', 'root')

    const { container } = render(() => (
      <PropsProvider value={{ visual: 'solid', 'data-testid': 'button' }}>
        <ButtonRoot>
          <ButtonLabel>Click me</ButtonLabel>
        </ButtonRoot>
      </PropsProvider>
    ))

    expect(container.querySelector('div')).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
        data-slot="root"
        data-testid="button"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('passed props override PropsProvider', () => {
    const { withProvider, PropsProvider } = createSlotRecipeContext(slotButton)
    const ButtonRoot = withProvider('div', 'root')

    const { container } = render(() => (
      <PropsProvider value={{ visual: 'solid' }}>
        <ButtonRoot visual="outline">Click me</ButtonRoot>
      </PropsProvider>
    ))

    expect(container.querySelector('div')).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_outline"
        data-slot="root"
      >
        Click me
      </div>
    `)
  })

  test('PropsProvider sets variants on withRootProvider', () => {
    const { withRootProvider, withContext, PropsProvider } = createSlotRecipeContext(slotButton)
    const ButtonRoot = withRootProvider((props: Record<string, unknown>) => <div {...props} />)
    const ButtonLabel = withContext('span', 'root')

    const { container } = render(() => (
      <PropsProvider value={{ visual: 'solid' }}>
        <ButtonRoot>
          <ButtonLabel>Click me</ButtonLabel>
        </ButtonRoot>
      </PropsProvider>
    ))

    expect(container.querySelector('div')).toMatchInlineSnapshot(`
      <div>
        <span
          class="slot-button__root slot-button__root--visual_solid"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })
})

describe('style context useClassNames', () => {
  test('a custom part updates when the root variant changes', () => {
    const [visual, setVisual] = createSignal<'outline' | 'solid'>('solid')
    const { withProvider, useClassNames } = createSlotRecipeContext(slotButton)
    const ButtonRoot = withProvider('div', 'root')
    const ButtonIcon = () => {
      const classes = useClassNames()
      return <svg class={classes().icon} />
    }

    const { container } = render(() => (
      <ButtonRoot visual={visual()}>
        <ButtonIcon />
      </ButtonRoot>
    ))
    const icon = () => container.querySelector('svg')?.getAttribute('class')

    expect(icon()).toBe('slot-button__icon slot-button__icon--visual_solid')

    setVisual('outline')
    expect(icon()).toBe('slot-button__icon slot-button__icon--visual_outline')
  })

  test('a custom part in an sva recipe gets the same class as withContext', () => {
    const [size, setSize] = createSignal<'sm' | 'lg'>('sm')
    const card = sva({
      className: 'card',
      slots: ['root', 'title'],
      variants: { size: { sm: { title: { fontSize: 'sm' } }, lg: { title: { fontSize: 'lg' } } } },
    })
    const { withProvider, withContext, useClassNames } = createSlotRecipeContext(card)
    const CardRoot = withProvider('div', 'root')
    const CardTitle = withContext('h2', 'title')
    const CustomTitle = () => {
      const classes = useClassNames()
      return <h3 class={classes().title} />
    }

    const { container } = render(() => (
      <CardRoot size={size()}>
        <CardTitle />
        <CustomTitle />
      </CardRoot>
    ))
    const classOf = (tag: string) => container.querySelector(tag)?.getAttribute('class')

    expect(classOf('h3')).toBe('fs_sm card__title')
    expect(classOf('h2')).toBe('fs_sm card__title')

    setSize('lg')
    expect(classOf('h3')).toBe('fs_lg card__title')
    expect(classOf('h2')).toBe('fs_lg card__title')
  })
})

describe('style context reactivity', () => {
  test('a withContext part follows the root variant', () => {
    const [visual, setVisual] = createSignal<'outline' | 'solid'>('solid')

    const { container } = render(() => (
      <Root visual={visual()}>
        <Label>Click me</Label>
      </Root>
    ))
    const label = () => container.querySelector('span')?.getAttribute('class')

    expect(label()).toBe('slot-button__root slot-button__root--visual_solid')

    setVisual('outline')
    expect(label()).toBe('slot-button__root slot-button__root--visual_outline')
  })
})
