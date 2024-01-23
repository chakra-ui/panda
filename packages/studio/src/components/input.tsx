import { cva } from '../../styled-system/css'
import { panda } from '../../styled-system/jsx'

export const inputRecipe = cva({
  base: {
    bg: 'card',
    width: 'full',
    px: '3',
    py: '2',
    rounded: 'md',
    color: { base: 'neutral.600', _dark: 'neutral.300' },
    shadow: 'sm',
    borderWidth: '1px',
    borderColor: 'border',
    _focusWithin: {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '2px',
      outlineColor: 'neutral.400',
    },
  },
  variants: {},
})

export const Input = panda('input', inputRecipe)

export const Textarea = panda('textarea', inputRecipe)

export const Select = panda('select', inputRecipe)
