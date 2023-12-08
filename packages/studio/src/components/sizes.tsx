import { toPx } from '@pandacss/shared'
import { Fragment } from 'react'
import { Grid, panda } from '../../styled-system/jsx'
import { getSortedSizes } from '../lib/sizes-sort'
import { TokenGroup } from './token-group'

export interface SizesProps {
  sizes: Map<string, any>
}

const contentRegex = /^(min|max|fit)-content$/
const unitRegex = /(ch|%)$/

export function Sizes(props: SizesProps) {
  const { sizes: tokens } = props
  const values = Array.from(tokens.values())

  const sizes = getSortedSizes(values).filter(
    (token) =>
      // remove negative values
      !token.extensions.isNegative &&
      // remove auto breakpoints
      !token.name.includes('breakpoint-') &&
      // remove fit-content, min-content, max-content, ch, %
      !contentRegex.test(token.value) &&
      !unitRegex.test(token.value),
  )

  return (
    <TokenGroup>
      <Grid display="grid" columnGap="10" rowGap="2.5" columns={5}>
        <panda.span fontWeight="semibold">Name</panda.span>
        <panda.span fontWeight="semibold">Size</panda.span>
        <panda.span fontWeight="semibold" gridColumn="span 3 / span 3">
          Pixels
        </panda.span>
        <panda.hr gridColumn="span 5 / span 5" />
        {sizes
          .sort((a, b) => a.extensions.prop - b.extensions.prop)
          .map((size, index) => (
            <Fragment key={index}>
              <b>{size.extensions.prop}</b>
              <span>{size.value}</span>
              <span>{toPx(size.value as string)}</span>
              <panda.span
                height="5"
                background="rgba(255, 192, 203, 0.5)"
                gridColumn="span 2 / span 2"
                style={{ width: size.value }}
              />
            </Fragment>
          ))}
      </Grid>
    </TokenGroup>
  )
}
