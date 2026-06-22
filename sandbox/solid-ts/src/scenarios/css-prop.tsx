import { css } from '../../styled-system/css'
import { HTMLStyledProps } from '../../styled-system/types'

type DivProps = HTMLStyledProps<'div'>

const Div = ({ css: cssProp = {}, children }: DivProps) => {
  const className = css(cssProp)
  return <div class={className}>{children}</div>
}

export const CssProp = () => {
  return (
    <div class={css({ color: '#fff' })}>
      <Div css={[{ color: 'red' }, { backgroundColor: 'blue.100' }]}>Div</Div>
      <Div css={{ color: 'blue.500' }}>Div</Div>
    </div>
  )
}
