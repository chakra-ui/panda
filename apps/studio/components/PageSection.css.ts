import { css } from 'styled-system/css'

export const section = css({
  display: 'grid',
  gap: '3',
  '& + &': { mt: '10' },
})

export const title = css({ fontSize: '15px', fontWeight: '500' })
