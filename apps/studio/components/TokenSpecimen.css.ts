import { css, cva } from 'styled-system/css'

const onDark = '[data-on-dark] &'

const checkerLight =
  'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)'
const checkerDark =
  'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)'

export const root = css({
  display: 'inline-flex',
  alignItems: 'center',
  minW: '0',
  '&[data-fill]': { display: 'flex', w: 'full' },
  '&[data-on-dark]': { p: '3', rounded: 'lg', bg: '#141414' },
})

export const lane = css({
  display: 'flex',
  alignItems: 'center',
  w: 'full',
  h: '22px',
  px: '3px',
  rounded: 'md',
  bg: 'subtle',
  [onDark]: { bg: 'rgba(255,255,255,0.06)' },
})

export const bar = css({ h: '16px', rounded: 'sm', bg: 'solid', minW: '2px', [onDark]: { bg: '#ededed' } })

export const radius = css({
  w: '56px',
  h: '56px',
  borderTopWidth: '1.5px',
  borderLeftWidth: '1.5px',
  borderColor: 'muted',
  bg: 'subtle',
  maskImage: 'linear-gradient(to right, #000 35%, transparent), linear-gradient(to bottom, #000 35%, transparent)',
  maskComposite: 'intersect',
  [onDark]: { borderColor: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.06)' },
})

export const box = cva({
  base: {
    display: 'grid',
    placeItems: 'center',
    w: '110px',
    h: '64px',
    rounded: 'lg',
    bg: 'paper',
    fontFamily: 'mono',
    fontSize: '11px',
    color: 'faint',
    [onDark]: { bg: '#1f1f1f', color: '#8a8a8a' },
  },
  variants: {
    // Shadows only read on a light surface unless the value was made for dark.
    light: { true: { bg: '#ffffff', color: '#52525b', borderColor: 'transparent' } },
  },
  compoundVariants: [{ light: true, css: { [onDark]: { bg: '#1f1f1f', color: '#8a8a8a' } } }],
})

export const motion = css({ w: '40px', h: '40px', rounded: 'lg', bg: 'solid', [onDark]: { bg: '#ededed' } })

export const ratio = css({
  h: '52px',
  maxW: '280px',
  bg: 'paper',
  boxShadow: 'raised',
  rounded: 'md',
  [onDark]: { bg: '#1f1f1f' },
})

export const checker = css({
  display: 'block',
  w: '110px',
  h: '40px',
  rounded: 'lg',
  overflow: 'hidden',
  boxShadow: 'raised',
  backgroundImage: checkerLight,
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
  _dark: { backgroundImage: checkerDark },
  [onDark]: { backgroundImage: checkerDark },
})

export const opacityFill = css({ display: 'block', w: 'full', h: 'full', bg: 'solid', [onDark]: { bg: '#ededed' } })

export const blur = css({
  w: '128px',
  h: '48px',
  rounded: 'sm',
  backgroundImage: 'repeating-linear-gradient(45deg, #64748b 0 9px, #cbd5e1 9px 18px)',
})
