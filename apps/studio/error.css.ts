import { css } from 'styled-system/css'

export const page = css({
  display: 'grid',
  placeItems: 'center',
  minH: '100dvh',
  p: '1',
  bg: 'sunken',
})

export const card = css({
  display: 'flex',
  flexDir: 'column',
  alignItems: 'center',
  textAlign: 'center',
  w: 'full',
  maxW: '460px',
  px: '8',
  py: '12',
  rounded: '2xl',
  bg: 'canvas',
  boxShadow: 'raised',
})

export const code = css({
  px: '2.5',
  h: '6',
  display: 'inline-flex',
  alignItems: 'center',
  rounded: 'full',
  bg: 'accent',
  color: 'onAccent',
  fontFamily: 'mono',
  fontSize: '12px',
  fontWeight: '500',
})

export const headline = css({
  mt: '5',
  fontSize: '28px',
  fontWeight: '600',
  letterSpacing: '-0.03em',
  lineHeight: '1.15',
})

export const detail = css({
  mt: '2',
  maxW: 'full',
  fontFamily: 'mono',
  fontSize: '12.5px',
  color: 'faint',
  truncate: true,
})

export const action = css({ mt: '8' })
