import { css } from 'styled-system/css'

export const cards = css({
  display: 'grid',
  gridTemplateColumns: { base: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
  gap: '3',
})

export const card = {
  root: css({
    display: 'flex',
    flexDir: 'column',
    gap: '3',
    p: '4',
    rounded: '2xl',
    bg: 'paper',
    boxShadow: 'raised',
  }),

  head: css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '3' }),

  title: css({ fontSize: '14px', fontWeight: '600' }),

  percent: css({ fontSize: '12px', color: 'muted', whiteSpace: 'nowrap' }),
}

export const meter = {
  track: css({ h: '1.5', rounded: 'full', bg: 'selected', overflow: 'hidden' }),

  fill: css({ h: 'full', minW: '2px', rounded: 'full', bg: 'solid', transition: 'width 0.3s ease' }),
}

export const hot = {
  list: css({ display: 'flex', flexWrap: 'wrap', gap: '1.5' }),

  token: css({
    px: '2',
    py: '1',
    rounded: 'md',
    bg: 'subtle',
    fontFamily: 'mono',
    fontSize: '11.5px',
    color: 'ink',
    '& b': { color: 'muted', fontWeight: '500' },
  }),
}

export const unused = {
  text: css({ fontFamily: 'mono', fontSize: '12px', lineHeight: '1.5', color: 'faint' }),

  label: css({ fontFamily: 'body', fontWeight: '500', color: 'muted' }),
}
