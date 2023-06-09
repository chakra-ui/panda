import { ComponentProps } from 'react'
import { css } from '../../styled-system/css'

const styles = css({
  my: '8',
  h: '1px',
  bg: { base: 'rgb(229 229 229 / 0.7)', _dark: 'rgb(219 234 254 / 0.1)' }
})

export const Divider = (props: ComponentProps<'hr'>) => (
  <hr className={styles} {...props} />
)
