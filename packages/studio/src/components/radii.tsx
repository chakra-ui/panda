import { toPx } from '@pandacss/shared'
import { Grid, panda, Stack } from '../../styled-system/jsx'
import context from '../lib/panda.context'
import { getSortedSizes } from '../lib/sizes-sort'
import { TokenGroup } from './token-group'

const radii = context.getCategory('radii')

export function Radii() {
  return (
    <TokenGroup>
      {radii && (
        <Grid display="grid" minChildWidth="10rem" gap="10">
          {getSortedSizes([...radii.values()])
            .sort((a, b) => parseFloat(toPx(a.value)!) - parseFloat(toPx(b.value)!))
            .map((size, index) => (
              <Stack direction="column" align="center" key={index}>
                <panda.div
                  width="80px"
                  height="80px"
                  background="rgba(255, 192, 203, 0.5)"
                  style={{ borderRadius: size.value }}
                />
                <Stack gap="1" align="center">
                  <b>{size.extensions.prop}</b>
                  <panda.span opacity="0.7">{size.value}</panda.span>
                </Stack>
              </Stack>
            ))}
        </Grid>
      )}
    </TokenGroup>
  )
}
