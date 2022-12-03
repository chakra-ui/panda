import { walkObject } from '@pandacss/shared'
import type { Dict, LayerStyles as LayerStylesType } from '@pandacss/types'
import { config } from 'virtual:panda'
import { EmptyState } from './empty-state'
import { LayerStylesIcon } from './icons'
import { panda } from '../../design-system/jsx'
import { TokenGroup } from './token-group'
import { TokenContent } from './token-content'

export function LayerStyles() {
  const textStyles = flattenLayerStyles(config.layerStyles)

  return (
    <TokenGroup>
      <TokenContent divideY="1px" divideColor="card">
        {textStyles ? (
          textStyles.map(([name, styles]) => (
            <panda.div paddingX="1" paddingY="2.5" key={name}>
              <panda.div borderColor="card">
                <panda.span fontWeight="medium">{name}</panda.span>
                <panda.div fontSize="small" flex="auto" marginTop="1.5">
                  {Object.entries(styles).map(([attr, value], i, arr) => (
                    <span key={attr}>{`${attr}: ${value}${i === arr.length - 1 ? '' : ', '}`}</span>
                  ))}
                </panda.div>
              </panda.div>
              <panda.div paddingX="4" paddingY="2" background="card" marginTop="5">
                <panda.div flex="auto" marginY="3" height="20" style={styles} />
              </panda.div>
            </panda.div>
          ))
        ) : (
          <EmptyState title="No Layer Styles" icon={<LayerStylesIcon />}>
            The config does not contain any Layer Styles
          </EmptyState>
        )}
      </TokenContent>
    </TokenGroup>
  )
}

function flattenLayerStyles(values: LayerStylesType | undefined) {
  if (!values) return

  const result: Dict = {}

  walkObject(
    values,
    (token, paths) => {
      if (token) {
        result[paths.join('.')] = token.value
      }
    },
    {
      stop(v) {
        return 'value' in v
      },
    },
  )

  return Object.entries(result)
}
