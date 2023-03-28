import { tokens } from '@box-extractor/vanilla-theme'
import { primary } from './site-tokens'

const lightVars = assignVars(colorModeVars, {
  color: {
    mainBg: primary['200'],
    secondaryBg: primary['300'],
    text: tokens.colors.blue['400'],
    bg: primary['600'],
    bgSecondary: primary['400'],
    bgHover: primary['100'],
  },
})
