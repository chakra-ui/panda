import { css } from '../styled-system/css'
import { button } from '../styled-system/recipes'

export const solidButton = button({ visual: 'solid' })
export const outlineButton = button({ visual: 'outline' })

export const heroStyles = css({
  bg: 'surface',
  color: 'brand',
  p: '8',
  borderRadius: '12px',
})
