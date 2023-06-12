import { Colors } from '@/components/token-docs/colors'
import { Spacings } from '@/components/token-docs/spacings'
import { css } from '@/styled-system/css'
import { FontSizes } from '../components/token-docs/font-sizes'
import { Fonts } from '../components/token-docs/fonts'
import { Radii } from '../components/token-docs/radii'

type Props = {
  type: string
}

const typeMap = {
  colors: Colors,
  spacing: Spacings,
  radii: Radii,
  fontSizes: FontSizes,
  fonts: Fonts
}

export const TokenDocs = (props: Props) => {
  const { type } = props
  const Comp = typeMap[type] ?? null
  return (
    <div className={css({ my: '10' })}>
      <Comp />
    </div>
  )
}
