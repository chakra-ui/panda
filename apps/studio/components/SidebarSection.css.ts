import { css } from 'styled-system/css'

export const section = css({ display: 'flex', flexDir: 'column', gap: '1', minW: '0' })

export const label = css({
  px: '2',
  py: '1',
  fontSize: '13px',
  fontWeight: '500',
  color: 'faint',
})

export const items = css({
  display: 'flex',
  flexDir: 'column',
  gap: '1',
})
