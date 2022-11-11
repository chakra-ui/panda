export enum NavKeys {
  COLORS = 'colors',
  LETTER_SPACINGS = 'letter-spacings',
  LINE_HEIGHTS = 'line-heights',
  FONT_WEIGHTS = 'font-weights',
  FONT_SIZES = 'font-sizes',
  SIZES = 'sizes',
  TEXT_STYLES = 'text-styles',
  LAYER_STYLES = 'layer-styles',
  TYPOGRAPHY_PLAYGROUND = 'typography-playground',
  SPACING_PLAYGROUND = 'spacing-playground',
  CONTRAST_CHECKER = 'contrast-checker',
}

export const navItems = [
  {
    label: 'Colors',
    id: NavKeys.COLORS,
    type: 'token',
  },
  {
    label: 'Letter Spacings',
    id: NavKeys.LETTER_SPACINGS,
    type: 'token',
  },
  {
    label: 'Line Heights',
    id: NavKeys.LINE_HEIGHTS,
    type: 'token',
  },
  {
    label: 'Font Weights',
    id: NavKeys.FONT_WEIGHTS,
    type: 'token',
  },
  {
    label: 'Font Sizes',
    id: NavKeys.FONT_SIZES,
    type: 'token',
  },
  {
    label: 'Sizes',
    id: NavKeys.SIZES,
    type: 'token',
  },
  {
    label: 'Text Styles',
    id: NavKeys.TEXT_STYLES,
    type: 'token',
  },
  {
    label: 'Layer Styles',
    id: NavKeys.LAYER_STYLES,
    type: 'token',
  },
  {
    label: 'Typography',
    id: NavKeys.TYPOGRAPHY_PLAYGROUND,
    type: 'playground',
  },
  {
    label: 'Spacing',
    id: NavKeys.SPACING_PLAYGROUND,
    type: 'playground',
  },
  {
    label: 'Color Contrast',
    id: NavKeys.CONTRAST_CHECKER,
    type: 'playground',
  },
]
