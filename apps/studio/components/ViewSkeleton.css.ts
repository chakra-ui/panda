import { css } from 'styled-system/css'

export const bone = css({
  display: 'block',
  rounded: 'md',
  bgImage: 'linear-gradient(90deg, {colors.subtle} 0%, {colors.selected} 50%, {colors.subtle} 100%)',
  bgSize: '200% 100%',
  animation: 'shimmer 1.6s ease-in-out infinite',
  _motionReduce: { animation: 'none', bg: 'subtle' },
})

export const stack = css({ display: 'grid', gap: '3' })

export const control = css({ h: '8', rounded: 'lg' })

export const list = css({ display: 'grid', gap: '2.5', mt: '3', px: '2' })

export const label = css({ w: '40%', h: '3', mb: '1.5' })

export const navItem = css({ h: '3' })

export const header = css({ display: 'grid', gap: '4' })

export const title = css({ w: '180px', h: '9', rounded: 'lg' })

export const description = css({ w: '260px', h: '4' })

export const body = css({ display: 'grid', gap: '6' })

export const filter = css({ h: '8', rounded: 'lg' })

export const grid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '3',
})

export const swatch = css({
  display: 'grid',
  gap: '2',
  animation: 'fadeIn 0.4s ease-out both',
})

export const chip = css({ h: '68px', rounded: 'xl' })

export const caption = css({ w: '60%', h: '3' })

export const status = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2.5',
  fontSize: '13px',
  color: 'muted',
})
