import { toPx } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { config } from 'virtual:panda'
import { Grid, panda, Stack } from '../../design-system/jsx'
import { getSortedSizes } from '../utils/sizes-sort'
import { TokenGroup } from './token-group'

//@ts-expect-error
const radii = new TokenDictionary(config.theme!).categoryMap.get('radii')

export function Radii() {
  return (
    <TokenGroup>
      {radii && (
        <Grid display="grid" minChildWidth="10rem" gap="10">
          {getSortedSizes([...radii.values()])
            .sort((a, b) => parseFloat(toPx(a.value)!) - parseFloat(toPx(b.value)!))
            .map((size) => (
              <Stack direction="column" align="center">
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
