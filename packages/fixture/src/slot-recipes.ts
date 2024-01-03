import type { SlotRecipeConfig } from '@pandacss/types'

export const slotRecipes: Record<string, SlotRecipeConfig> = {
  checkbox: {
    className: 'checkbox',
    slots: ['root', 'control', 'label'],
    base: {
      root: { display: 'flex', alignItems: 'center', gap: '2' },
      control: { borderWidth: '1px', borderRadius: 'sm' },
      label: { marginStart: '2' },
    },
    variants: {
      size: {
        sm: {
          control: { textStyle: 'headline.h1', width: '8', height: '8' },
          label: { fontSize: 'sm' },
        },
        md: {
          control: { width: '10', height: '10' },
          label: { fontSize: 'md' },
        },
        lg: {
          control: { width: '12', height: '12' },
          label: { fontSize: 'lg' },
        },
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  },
  badge: {
    className: 'badge',
    slots: ['title', 'body'],
    base: {
      title: { bg: 'red.300', rounded: 'sm' },
    },
    variants: {
      size: {
        sm: {
          title: { px: '4' },
          body: { color: 'red' },
        },
      },
      raised: {
        true: {
          title: { shadow: 'md' },
        },
      },
    },
    compoundVariants: [
      {
        raised: true,
        size: 'sm',
        css: {
          title: { color: 'ButtonHighlight' },
        },
      },
    ],
  },
}
