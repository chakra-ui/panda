import { ParentProps } from 'solid-js'
import { RecipeVariantProps, css, cva } from '../../styled-system/css'
import { splitCssProps } from '../../styled-system/jsx'
import { JsxStyleProps } from '../../styled-system/types'

const btn = cva({
  variants: {
    size: {
      sm: { textStyle: 'sm' },
      md: { textStyle: 'md' },
    },
  },
})

type VariantProps = RecipeVariantProps<typeof btn>

const Button = (props: ParentProps<VariantProps & JsxStyleProps>) => {
  const [variants, rest] = btn.splitVariantProps(props)
  const [cssProps, elementProps] = splitCssProps(rest)
  return (
    <button {...elementProps} class={css(btn.raw(variants), cssProps)}>
      aaa
    </button>
  )
}

export const SplitCssProps = () => {
  return (
    <div>
      <Button size="md">button</Button>
    </div>
  )
}
