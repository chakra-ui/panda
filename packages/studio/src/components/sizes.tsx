import { toPx } from '@pandacss/shared'
import { Grid, panda } from '../../styled-system/jsx'
import context from '../lib/panda.context'
import { getSortedSizes } from '../lib/sizes-sort'
import { TokenGroup } from './token-group'

export type SizesProps = { sizes: Map<string, any> }

export function Sizes() {
  const values = Array.from(context.getCategory('sizes').values())

  const sizes = getSortedSizes(values)

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
          .map((size) => (
            <>
              <b>{size.extensions.prop}</b>
              <span>{size.value}</span>
              <span>{toPx(size.value as string)}</span>
              <panda.span
                height="5"
                background="rgba(255, 192, 203, 0.5)"
                gridColumn="span 2 / span 2"
                style={{ width: size.value }}
              />
            </>
          ))}
      </Grid>
    </TokenGroup>
  )
}
