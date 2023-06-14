import { Breakpoints } from '@/components/token-docs/breakpoints'
import { Colors } from '@/components/token-docs/colors'
import { FontSizes } from '@/components/token-docs/font-sizes'
import { Fonts } from '@/components/token-docs/fonts'
import { Radii } from '@/components/token-docs/radii'
import { Shadows } from '@/components/token-docs/shadows'
import { Spacings } from '@/components/token-docs/spacings'
import { css } from '@/styled-system/css'
import { Fragment } from 'react'

type Props = {
  type: string
}

const typeMap = {
  colors: Colors,
  spacing: Spacings,
  radii: Radii,
  fontSizes: FontSizes,
  fonts: Fonts,
  breakpoints: Breakpoints,
  shadows: Shadows
}

export const TokenDocs = (props: Props) => {
  const { type } = props
  const Comp = typeMap[type] ?? Fragment
  return (
    <div className={css({ my: '10' })}>
      <Comp />
    </div>
  )
}
