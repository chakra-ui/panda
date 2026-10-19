import { css } from 'styled-system/css'

const mono = { fontFamily: 'mono', fontSize: '12px' } as const

export const contents = css({ display: 'contents' })

export const empty = css({ color: 'faint', fontSize: '14px', py: '12' })

export const section = {
  root: css({ display: 'grid', gap: '6', '& + &': { mt: '12' } }),

  head: css({ display: 'flex', alignItems: 'center', gap: '2', fontSize: '15px', fontWeight: '500', color: 'ink' }),

  count: css({ fontSize: '12px', fontWeight: '400', color: 'faint' }),
}

export const palette = {
  root: css({ display: 'grid', gap: '3' }),

  head: css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    fontSize: '13px',
    fontWeight: '500',
    color: 'muted',
    textTransform: 'capitalize',
  }),
}

export const swatches = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '3',
})

export const info = {
  content: css({
    minW: '240px',
    maxW: '320px',
    p: '3',
    bg: 'paper',
    rounded: 'xl',
    boxShadow: 'overlay',
    zIndex: '40',
    _focusVisible: { outline: 'none' },
  }),

  name: css({ ...mono, fontSize: '12.5px', color: 'ink', mb: '2' }),

  list: css({ display: 'grid', gap: '1.5' }),

  term: css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    ...mono,
    fontSize: '11px',
    color: 'muted',
  }),

  swatch: css({
    w: '3',
    h: '3',
    flexShrink: 0,
    rounded: 'sm',
    borderWidth: '1px',
    borderColor: 'line',
  }),

  value: css({ ...mono, fontSize: '11.5px', color: 'ink', mb: '1', wordBreak: 'break-all' }),
}

export const row = {
  list: css({ display: 'flex', flexDir: 'column', gap: '1' }),

  name: css({ ...mono, fontSize: '13px', color: 'ink' }),

  value: css({
    ...mono,
    color: 'faint',
    textAlign: 'right',
    whiteSpace: 'nowrap',
    minW: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    gridColumn: { base: '2', sm: 'auto' },
    gridRow: { base: '1', sm: 'auto' },
    '&[data-copied]': { color: 'success' },
  }),

  alias: css({ display: 'block', mt: '0.5', color: 'muted' }),

  track: css({
    display: 'flex',
    gap: '4',
    minW: '0',
    alignItems: 'center',
    gridColumn: { base: '1 / -1', sm: 'auto' },
    gridRow: { base: '2', sm: 'auto' },
    mt: { base: '2', sm: '0' },
  }),
}

export const variant = {
  root: css({ display: 'grid', justifyItems: 'start', gap: '1.5', minW: '0', '&:has([data-fill])': { flex: '1' } }),

  label: css({ fontFamily: 'mono', fontSize: '11px', color: 'faint' }),
}

export const layer = {
  list: css({ display: 'flex', flexDir: 'column', pt: '2', pb: '10', pl: '1' }),

  card: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4',
    w: 'min(420px, 100%)',
    px: '4',
    py: '3',
    rounded: 'xl',
    bg: 'paper',
    borderWidth: '1px',
    borderColor: 'line',
    cursor: 'pointer',
    transition: 'transform 0.12s',
    '&:not(:first-child)': { mt: '-6px' },
    _hover: { transform: 'translateX(4px)' },
    outline: '2px solid transparent',
    outlineOffset: '3px',
    '&:is(:focus-visible, [data-focused])': { outlineColor: 'ring' },
  }),

  name: css({ ...mono, fontSize: '13px', color: 'ink' }),

  value: css({ ...mono, color: 'faint' }),
}

export const screen = {
  list: css({ display: 'flex', flexDir: 'column', gap: '2', maxW: '760px' }),

  row: css({
    display: 'grid',
    gridTemplateColumns: '56px minmax(0,1fr) 72px',
    alignItems: 'center',
    gap: '3',
    p: '2',
    rounded: 'lg',
    cursor: 'pointer',
    _hover: { bg: 'subtle' },
    outline: '2px solid transparent',
    outlineOffset: '1px',
    '&:is(:focus-visible, [data-focused])': { outlineColor: 'ring' },
  }),

  name: css({ ...mono, fontSize: '13px', color: 'ink' }),

  lane: css({ h: '18px', p: '3px', bg: 'subtle', rounded: 'md', overflow: 'hidden' }),

  bar: css({ display: 'block', h: 'full', bg: 'solid', rounded: 'sm', minW: '3px' }),

  value: css({ ...mono, color: 'faint', textAlign: 'right' }),
}
