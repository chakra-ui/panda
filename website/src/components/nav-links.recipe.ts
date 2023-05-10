import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'
import { SystemStyleObject } from '../../styled-system/types'

const anatomy = createAnatomy('navLinks', [
  'root',
  'prevLink',
  'prevIcon',
  'nextLink',
  'nextIcon'
])

const parts = defineParts(anatomy.build())

const link = {
  display: 'flex',
  maxWidth: '50%',
  alignItems: 'center',
  gap: 1,
  py: 4,
  textStyle: 'md',
  fontWeight: 'medium',
  color: 'gray.600',
  transitionProperty: 'colors',
  wordBreak: 'break-word',
  _hover: { color: 'primary.600' },
  _dark: { color: 'gray.300' },
  md: { textStyle: 'lg' }
} as SystemStyleObject

const icon = {
  display: 'inline',
  height: '5',
  flexShrink: 0
} as SystemStyleObject

export const navLinksRecipe = defineRecipe({
  name: 'navLinks',
  description: 'A navLinks style',
  jsx: ['NavLinks'],
  base: parts({
    root: {
      mb: 8,
      display: 'flex',
      alignItems: 'center',
      borderTopWidth: '1px',
      pt: 8,
      borderTopColor: 'neutral.400',
      _dark: { borderTopColor: 'neutral.800' },
      _moreContrast: {
        borderTopColor: 'neutral.400',
        _dark: { borderTopColor: 'neutral.400' }
      },
      _print: { display: 'none' }
    },
    prevLink: {
      ...link,
      _ltr: { pr: 4 },
      _rtl: { pl: 4 }
    },
    prevIcon: {
      ...icon,
      _ltr: { transform: 'rotate(180deg)' }
    },
    nextLink: {
      ...link,
      _ltr: { ml: 'auto', pl: 4, textAlign: 'right' },
      _rtl: { mr: 'auto', pr: 4, textAlign: 'left' }
    },
    nextIcon: {
      ...icon,
      _rtl: { transform: 'rotate(-180deg)' }
    }
  })
})
