import { sva } from 'styled-system/css'

export const logo = sva({
  slots: ['root', 'mark', 'glyph', 'pill'],
  base: {
    root: { display: 'inline-flex', alignItems: 'center', fontWeight: '500', letterSpacing: '-0.01em', color: 'ink' },
    mark: {
      display: 'grid',
      placeItems: 'center',
      flexShrink: '0',
      bg: 'accent',
      color: '#0b0b0b',
      boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)',
    },
    pill: { borderColor: 'currentColor', lineHeight: '1' },
  },
  variants: {
    size: {
      sm: {
        root: { gap: '1.5', fontSize: '13px' },
        mark: { w: '6', h: '6', rounded: 'md' },
        glyph: { w: '3.5', h: '3.5' },
        pill: { px: '1.5', py: '1', borderWidth: '1.5px', rounded: 'md' },
      },
      lg: {
        root: { gap: '2.5', fontSize: '22px' },
        mark: { w: '11', h: '11', rounded: '10px' },
        glyph: { w: '6', h: '6' },
        pill: { px: '2.5', pt: '1', pb: '1.5', borderWidth: '2px', rounded: '10px' },
      },
    },
  },
})
