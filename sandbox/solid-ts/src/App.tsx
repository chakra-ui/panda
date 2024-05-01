import { ParentProps } from 'solid-js'
import { RecipeVariantProps, css, cva } from '../styled-system/css'
import { splitCssProps } from '../styled-system/jsx'
import { HTMLStyledProps, JsxStyleProps } from '../styled-system/types'

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

type DivProps = HTMLStyledProps<'div'>

export const Div = ({ css: cssProp = {}, children }: DivProps) => {
  const className = css(cssProp)
  // Argument of type 'SystemStyleObject | SystemStyleObject[]' is not assignable to parameter of type 'false | SystemStyleObject | null | undefined'.

  return <div class={className}>{children}</div>
}

export function App() {
  return (
    <>
      <Div css={[{ color: 'red.300' }, { backgroundColor: 'blue.100' }]}>Div</Div>
      <Div css={{ color: 'blue.500' }}>Div</Div>
      <Button size="md">button</Button>
    </>
  )
}

export default App
