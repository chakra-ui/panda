import { defineRecipe } from '@pandacss/dev'

const focusRing = { outline: '2px solid', outlineColor: 'ring', outlineOffset: '2px' } as const

export const button = defineRecipe({
  className: 'button',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5',
    fontFamily: 'body',
    fontWeight: '500',
    lineHeight: '1',
    rounded: 'lg',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    transition: 'background 0.15s, color 0.15s, transform 0.1s',
    _active: { _enabled: { transform: 'translateY(0.5px)' } },
    _focusVisible: { outline: 'none', boxShadow: 'focusHalo' },
    _disabled: { opacity: 0.5, cursor: 'not-allowed' },
    '& svg': { flexShrink: 0 },
  },
  variants: {
    variant: {
      primary: {
        bg: 'accent',
        color: 'onAccent',
        boxShadow: 'buttonPrimary',
        _hover: { _enabled: { bg: 'accentHover' } },
      },
      secondary: {
        bg: 'paper',
        color: 'ink',
        boxShadow: 'button',
        _hover: { _enabled: { bg: 'canvas' } },
      },
      ghost: {
        bg: 'transparent',
        color: 'muted',
        _hover: { _enabled: { color: 'ink', bg: 'selected' } },
      },
    },
    size: {
      sm: { h: '8', px: '3', fontSize: '13px' },
      md: { h: '9', px: '3.5', fontSize: '13.5px' },
      icon: { h: '8', w: '8', px: '0', fontSize: '13px' },
    },
  },
  defaultVariants: { variant: 'secondary', size: 'sm' },
})

export const control = defineRecipe({
  className: 'control',
  base: {
    w: 'full',
    rounded: 'lg',
    bg: 'paper',
    color: 'ink',
    boxShadow: 'inset',
    outline: 'none',
    fontFamily: 'body',
    fontSize: '13px',
    transition: 'box-shadow 0.15s',
    _focusVisible: { boxShadow: 'focusHalo' },
    _placeholder: { color: 'faint' },
  },
  variants: {
    kind: {
      input: { h: '8', px: '3' },
      textarea: { minH: '120px', p: '3', fontFamily: 'mono', fontSize: '12px', resize: 'vertical' },
    },
  },
  defaultVariants: { kind: 'input' },
})

export const navItem = defineRecipe({
  className: 'navItem',
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    h: { base: '11', md: '8' },
    px: { base: '2.5', md: '2' },
    w: 'full',
    flexShrink: 0,
    rounded: 'md',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    fontFamily: 'body',
    fontSize: { base: '15px', md: '13px' },
    fontWeight: '500',
    color: 'muted',
    bg: 'transparent',
    transition: 'background 0.12s, color 0.12s',
    _hover: { color: 'ink' },
    _focusVisible: { ...focusRing, outlineOffset: '-2px' },
    position: 'relative',
    '&:is([data-selected], [aria-current=page])': {
      bg: 'selected',
      color: 'ink',
      _before: {
        content: '""',
        position: 'absolute',
        left: '0',
        top: '1.5',
        bottom: '1.5',
        w: '3px',
        rounded: 'full',
        bg: 'accent',
      },
    },
  },
})

export const tokenCell = defineRecipe({
  className: 'tokenCell',
  base: {
    display: 'block',
    w: 'full',
    textAlign: 'left',
    p: '0',
    bg: 'transparent',
    cursor: 'pointer',
    transition: 'background 0.12s, outline-color 0.15s',
    outline: '2px solid transparent',
    outlineOffset: '3px',
    '&:is(:focus-visible, [data-focused])': { outlineColor: 'ring' },
  },
  variants: {
    layout: {
      swatch: {
        rounded: 'xl',
      },
      row: {
        display: 'grid',
        gridTemplateColumns: {
          base: 'auto minmax(0,1fr)',
          // Cap the value track so a long font stack can't squeeze the specimen.
          sm: '150px minmax(180px,1fr) minmax(0,280px)',
        },
        alignItems: 'center',
        gap: '4',
        px: '3',
        py: '2.5',
        rounded: 'lg',
        outlineOffset: '1px',
        _hover: { bg: 'subtle' },
      },
    },
  },
  defaultVariants: { layout: 'row' },
})
