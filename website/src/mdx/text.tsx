import { ComponentProps } from 'react'
import { css } from '../../styled-system/css'

const styles = css({
  mt: { base: '6', _first: '0' },
  lineHeight: '1.75rem'
})

export const Text = (props: ComponentProps<'p'>) => (
  <p className={styles} {...props} />
)
