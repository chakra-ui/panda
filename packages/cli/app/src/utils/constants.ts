import {
  ColorContrastIcon,
  ColorIcon,
  FontSizesIcon,
  FontWeightIcon,
  LayerStylesIcon,
  LetterSpacingIcon,
  LineHeightIcon,
  SizesIcon,
  SpacingIcon,
  TextStylesIcon,
  TypographyIcon,
} from '../components/icons'

export enum NavKeys {
  RADII = 'radii',
  COLORS = 'colors',
  LETTER_SPACINGS = 'letter-spacings',
  LINE_HEIGHTS = 'line-heights',
  FONT_WEIGHTS = 'font-weights',
  FONT_SIZES = 'font-sizes',
  SIZES = 'sizes',
  TEXT_STYLES = 'text-styles',
  LAYER_STYLES = 'layer-styles',
  TYPOGRAPHY_PLAYGROUND = 'playground/typography',
  SPACING_PLAYGROUND = 'playground/spacing',
  CONTRAST_CHECKER = 'playground/contrast-checker',
}

export type NavItemData = {
  label: string
  id: NavKeys
  description: string
  icon: React.ElementType
  type: string
}

export const navItems: NavItemData[] = [
  {
    label: 'Colors',
    id: NavKeys.COLORS,
    description: 'A solid color palette for any context',
    icon: ColorIcon,
    type: 'token',
  },
  {
    label: 'Letter Spacings',
    id: NavKeys.LETTER_SPACINGS,
    description: 'Letter spacing is the space between text characters.',
    icon: LetterSpacingIcon,
    type: 'token',
  },
  {
    label: 'Line Heights',
    id: NavKeys.LINE_HEIGHTS,
    description: 'Line height is the vertical distance between two lines.',
    icon: LineHeightIcon,
    type: 'token',
  },
  {
    label: 'Font Weights',
    id: NavKeys.FONT_WEIGHTS,
    description: 'Font weight determines how bold or light text appears.',
    icon: FontWeightIcon,
    type: 'token',
  },
  {
    label: 'Font Sizes',
    id: NavKeys.FONT_SIZES,
    description: 'Font size updates the size of a font, and its relative units.',
    icon: FontSizesIcon,
    type: 'token',
  },
  {
    label: 'Sizes',
    id: NavKeys.SIZES,
    description: 'Preview your pre configured sizes.',
    icon: SizesIcon,
    type: 'token',
  },
  {
    label: 'Border Radius',
    id: NavKeys.RADII,
    description: 'Preview your pre configured radii.',
    icon: SizesIcon,
    type: 'token',
  },
  {
    label: 'Text Styles',
    id: NavKeys.TEXT_STYLES,
    description: 'Preview your pre configured text styles.',
    icon: TextStylesIcon,
    type: 'token',
  },
  {
    label: 'Layer Styles',
    id: NavKeys.LAYER_STYLES,
    description: 'Preview your pre configured layer styles.',
    icon: LayerStylesIcon,
    type: 'token',
  },
  {
    label: 'Typography',
    id: NavKeys.TYPOGRAPHY_PLAYGROUND,
    description: 'Visually test font styles with any text.',
    icon: TypographyIcon,
    type: 'playground',
  },
  {
    label: 'Spacing',
    id: NavKeys.SPACING_PLAYGROUND,
    description: 'Visually test spacing tokens with real containers.',
    icon: SpacingIcon,
    type: 'playground',
  },
  {
    label: 'Color Contrast',
    id: NavKeys.CONTRAST_CHECKER,
    description: 'Test contrast ratio between two colors.',
    icon: ColorContrastIcon,
    type: 'playground',
  },
]
