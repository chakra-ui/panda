import { defineConfig, defineRecipe, defineSlotRecipe } from '@pandacss/dev'

const status = (palette: string) => ({
  solid: { value: { base: `{colors.${palette}.600}`, _dark: `{colors.${palette}.500}` } },
  fg: { value: { base: `{colors.${palette}.700}`, _dark: `{colors.${palette}.300}` } },
  muted: { value: { base: `{colors.${palette}.200}`, _dark: `{colors.${palette}.800}` } },
  subtle: { value: { base: `{colors.${palette}.50}`, _dark: `{colors.${palette}.950}` } },
})

const accent = (palette: string) => ({
  solid: { value: { base: `{colors.${palette}.600}`, _dark: `{colors.${palette}.400}` } },
  emphasized: { value: { base: `{colors.${palette}.700}`, _dark: `{colors.${palette}.300}` } },
  contrast: { value: { base: '{colors.white}', _dark: `{colors.${palette}.950}` } },
  fg: { value: { base: `{colors.${palette}.700}`, _dark: `{colors.${palette}.300}` } },
  muted: { value: { base: `{colors.${palette}.200}`, _dark: `{colors.${palette}.800}` } },
  subtle: { value: { base: `{colors.${palette}.50}`, _dark: `{colors.${palette}.950}` } },
  focusRing: { value: { base: `{colors.${palette}.500}`, _dark: `{colors.${palette}.400}` } },
})

const button = defineRecipe({
  className: 'button',
  description: 'Triggers an action. Use one solid button per view for the primary action.',
  base: { display: 'inline-flex', alignItems: 'center', gap: '2', fontWeight: 'medium', rounded: 'l2' },
  variants: {
    variant: {
      solid: { bg: 'accent.solid', color: 'accent.contrast' },
      outline: { borderWidth: '1px', borderColor: 'border', color: 'fg' },
      ghost: { color: 'fg', _hover: { bg: 'bg.muted' } },
      danger: { bg: 'danger.solid', color: 'white' },
    },
    size: {
      sm: { h: '8', px: '3', textStyle: 'label.sm' },
      md: { h: '10', px: '4', textStyle: 'label.md' },
      lg: { h: '12', px: '5', textStyle: 'label.md' },
    },
  },
  defaultVariants: { variant: 'solid', size: 'md' },
})

const badge = defineRecipe({
  className: 'badge',
  description: 'Labels status or metadata. Keep the text to one or two words.',
  base: { display: 'inline-flex', alignItems: 'center', rounded: 'full', px: '2', textStyle: 'label.sm' },
  variants: {
    tone: {
      neutral: { bg: 'bg.muted', color: 'fg.muted' },
      accent: { bg: 'accent.subtle', color: 'accent.fg' },
      success: { bg: 'success.subtle', color: 'success.fg' },
      warning: { bg: 'warning.subtle', color: 'warning.fg' },
      danger: { bg: 'danger.subtle', color: 'danger.fg' },
    },
  },
  defaultVariants: { tone: 'neutral' },
})

const input = defineRecipe({
  className: 'input',
  description: 'Single-line text field.',
  base: { w: 'full', rounded: 'l2', borderWidth: '1px', borderColor: 'border', bg: 'bg.surface' },
  variants: {
    size: { sm: { h: '8', px: '2.5' }, md: { h: '10', px: '3' } },
    invalid: { true: { borderColor: 'danger.solid' } },
  },
  defaultVariants: { size: 'md' },
})

const card = defineSlotRecipe({
  className: 'card',
  description: 'Groups related content on a raised surface.',
  slots: ['root', 'header', 'title', 'description', 'body', 'footer'],
  base: {
    root: { layerStyle: 'surface.raised', rounded: 'l3' },
    header: { p: '5', pb: '0' },
    title: { textStyle: 'heading.sm' },
    description: { textStyle: 'body.sm', color: 'fg.muted' },
    body: { p: '5' },
    footer: { p: '5', pt: '0', display: 'flex', gap: '2', justifyContent: 'flex-end' },
  },
  variants: {
    variant: {
      elevated: { root: { boxShadow: 'md' } },
      outline: { root: { borderWidth: '1px', borderColor: 'border' } },
    },
  },
  defaultVariants: { variant: 'outline' },
})

const alert = defineSlotRecipe({
  className: 'alert',
  description: 'Inline message about the state of the page or a task.',
  slots: ['root', 'icon', 'title', 'description'],
  base: {
    root: { display: 'flex', gap: '3', p: '4', rounded: 'l2' },
    title: { textStyle: 'label.md' },
    description: { textStyle: 'body.sm' },
  },
  variants: {
    status: {
      info: { root: { bg: 'info.subtle', color: 'info.fg' } },
      success: { root: { bg: 'success.subtle', color: 'success.fg' } },
      warning: { root: { bg: 'warning.subtle', color: 'warning.fg' } },
      danger: { root: { bg: 'danger.subtle', color: 'danger.fg' } },
    },
  },
  defaultVariants: { status: 'info' },
})

export default defineConfig({
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  include: [],
  outdir: 'styled-system',
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: {
            50: { value: '#eef2ff' },
            100: { value: '#e0e7ff' },
            200: { value: '#c7d2fe' },
            300: { value: '#a5b4fc' },
            400: { value: '#818cf8' },
            500: { value: '#6366f1' },
            600: { value: '#4f46e5' },
            700: { value: '#4338ca' },
            800: { value: '#3730a3' },
            900: { value: '#312e81' },
            950: { value: '#1e1b4b' },
          },
        },
        gradients: {
          brand: { value: 'linear-gradient(135deg, {colors.brand.500}, {colors.violet.500})' },
          sunrise: { value: 'linear-gradient(120deg, #f6e458, #fb923c 55%, #f43f5e)' },
          aurora: {
            value:
              'radial-gradient(circle at 20% 20%, #a5b4fc, transparent 50%), radial-gradient(circle at 80% 30%, #67e8f9, transparent 45%), linear-gradient(180deg, #eef2ff, #fdf4ff)',
          },
        },
        zIndex: {
          hide: { value: -1 },
          base: { value: 0 },
          dropdown: { value: 1000 },
          sticky: { value: 1100 },
          overlay: { value: 1300 },
          modal: { value: 1400 },
          popover: { value: 1500 },
          toast: { value: 1700 },
          tooltip: { value: 1800 },
        },
        opacity: {
          invisible: { value: '0' },
          disabled: { value: '0.4' },
          muted: { value: '0.64' },
          opaque: { value: '1' },
        },
        borders: {
          subtle: { value: '1px solid {colors.neutral.200}' },
          dashed: { value: '1px dashed {colors.neutral.300}' },
          strong: { value: '2px solid {colors.neutral.900}' },
          focus: { value: '2px solid {colors.brand.500}' },
        },
        fonts: {
          heading: { value: "'Source Serif 4', Georgia, serif" },
          body: { value: "'Inter', system-ui, sans-serif" },
          code: { value: "'JetBrains Mono', ui-monospace, monospace" },
        },
      },
      semanticTokens: {
        colors: {
          bg: {
            canvas: { value: { base: '{colors.white}', _dark: '{colors.neutral.950}' } },
            surface: { value: { base: '{colors.white}', _dark: '{colors.neutral.900}' } },
            subtle: { value: { base: '{colors.neutral.50}', _dark: '{colors.neutral.900}' } },
            muted: { value: { base: '{colors.neutral.100}', _dark: '{colors.neutral.800}' } },
            emphasized: { value: { base: '{colors.neutral.200}', _dark: '{colors.neutral.700}' } },
            inverted: { value: { base: '{colors.neutral.900}', _dark: '{colors.neutral.50}' } },
            overlay: { value: { base: 'rgba(23, 23, 23, 0.4)', _dark: 'rgba(0, 0, 0, 0.6)' } },
          },
          fg: {
            DEFAULT: { value: { base: '{colors.neutral.900}', _dark: '{colors.neutral.50}' } },
            muted: { value: { base: '{colors.neutral.600}', _dark: '{colors.neutral.400}' } },
            subtle: { value: { base: '{colors.neutral.500}', _dark: '{colors.neutral.500}' } },
            disabled: { value: { base: '{colors.neutral.400}', _dark: '{colors.neutral.600}' } },
            inverted: { value: { base: '{colors.neutral.50}', _dark: '{colors.neutral.900}' } },
          },
          border: {
            DEFAULT: { value: { base: '{colors.neutral.200}', _dark: '{colors.neutral.800}' } },
            muted: { value: { base: '{colors.neutral.100}', _dark: '{colors.neutral.900}' } },
            emphasized: { value: { base: '{colors.neutral.300}', _dark: '{colors.neutral.700}' } },
          },
          accent: accent('brand'),
          info: status('sky'),
          success: status('green'),
          warning: status('amber'),
          danger: status('red'),
        },
        gradients: {
          hero: {
            value: {
              base: 'linear-gradient(180deg, {colors.brand.50}, {colors.white})',
              _dark: 'linear-gradient(180deg, {colors.brand.950}, {colors.neutral.950})',
            },
          },
        },
        radii: {
          l1: { value: '{radii.sm}' },
          l2: { value: '{radii.md}' },
          l3: { value: '{radii.xl}' },
        },
        shadows: {
          raised: {
            value: {
              base: '0 1px 2px rgba(23, 23, 23, 0.06), 0 1px 3px rgba(23, 23, 23, 0.1)',
              _dark: '0 0 0 1px rgba(255, 255, 255, 0.06), 0 1px 3px rgba(0, 0, 0, 0.5)',
            },
          },
          overlay: {
            value: {
              base: '0 12px 32px -8px rgba(23, 23, 23, 0.2)',
              _dark: '0 0 0 1px rgba(255, 255, 255, 0.08), 0 12px 32px -8px rgba(0, 0, 0, 0.7)',
            },
          },
        },
      },
      textStyles: {
        display: {
          description: 'Marketing headlines',
          value: {
            fontFamily: 'heading',
            fontSize: '5xl',
            fontWeight: 'bold',
            lineHeight: 'tight',
            letterSpacing: 'tighter',
          },
        },
        heading: {
          lg: {
            description: 'Page titles',
            value: { fontFamily: 'heading', fontSize: '3xl', fontWeight: 'semibold', lineHeight: 'tight' },
          },
          md: {
            description: 'Section titles',
            value: { fontFamily: 'heading', fontSize: '2xl', fontWeight: 'semibold', lineHeight: 'snug' },
          },
          sm: {
            description: 'Card and dialog titles',
            value: { fontFamily: 'heading', fontSize: 'lg', fontWeight: 'semibold', lineHeight: 'snug' },
          },
        },
        body: {
          md: { description: 'Default reading text', value: { fontSize: 'md', lineHeight: 'relaxed' } },
          sm: { description: 'Secondary text and help text', value: { fontSize: 'sm', lineHeight: 'normal' } },
        },
        label: {
          md: {
            description: 'Buttons and form labels',
            value: { fontSize: 'sm', fontWeight: 'medium', lineHeight: 'none' },
          },
          sm: {
            description: 'Badges and captions',
            value: { fontSize: 'xs', fontWeight: 'medium', lineHeight: 'none' },
          },
        },
        code: { description: 'Inline code and snippets', value: { fontFamily: 'code', fontSize: 'sm' } },
      },
      layerStyles: {
        surface: {
          raised: { description: 'Cards and popovers', value: { bg: 'bg.surface', boxShadow: 'raised' } },
          sunken: { description: 'Wells and inset panels', value: { bg: 'bg.subtle' } },
        },
        overlay: { description: 'Backdrop behind dialogs', value: { bg: 'bg.overlay' } },
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animationStyles: {
        enter: { description: 'Dialogs and popovers opening', value: { animation: 'slideUp 0.2s ease-out' } },
        fade: { description: 'Toasts and tooltips', value: { animation: 'fadeIn 0.15s ease-out' } },
      },
      recipes: { button, badge, input },
      slotRecipes: { card, alert },
    },
  },
  themes: {
    ocean: { semanticTokens: { colors: { accent: accent('cyan') } } },
    rose: { semanticTokens: { colors: { accent: accent('rose') } } },
  },
})
