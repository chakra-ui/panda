import { ParentProps, createSignal } from 'solid-js'
import { RecipeVariantProps, css, cva } from '../styled-system/css'
import { splitCssProps, styled } from '../styled-system/jsx'
import { JsxStyleProps } from '../styled-system/types'

const btn = cva({ variants: { size: { sm: { textStyle: 'sm' }, md: { textStyle: 'md' } } } })

type ButtonProps = RecipeVariantProps<typeof btn>

const Button = (props: ParentProps<ButtonProps & JsxStyleProps>) => {
  const [variants, rest] = btn.splitVariantProps(props)
  const [cssProps, elementProps] = splitCssProps(rest)
  return (
    <button {...elementProps} class={css(btn.raw(variants), cssProps)}>
      aaa
    </button>
  )
}

export function App() {
  const [value, setValue] = createSignal(0)
  return (
    <>
      <styled.div
        background="pink"
        paddingBlock="20px"
        fontFamily="SF Mono"
        color="black"
        class={value() === 3 ? 'red' : 'blue'}
        fontSize="20px"
        marginTop="20px"
        paddingLeft="90px"
        borderRadius="10px"
        data-value={value()}
        onClick={() => {
          setValue(value() + 1)
        }}
      >
        {value()} Edit <code>src/App.tsx</code> and save to reload.
      </styled.div>
      <div
        class={css({
          color: 'fg.default',
          fontSize: '2xs',
          '--button-color': 'colors.red.300',
          '--xxx': 'spacing.10',
        })}
      >
        {' '}
        aaa
      </div>
      <Button size="md">button</Button>
    </>
  )
}

export default App
