import { walkObject } from '@pandacss/shared'
import type { Dict, LayerStyles as LayerStylesType } from '@pandacss/types'
import { config } from 'virtual:panda'
import { EmptyState } from '../components/empty-state'
import { LayerStylesIcon } from '../components/icons'
import { panda } from 'design-system/jsx'
import { TokenGroup } from '../components/token-group'
import { TokenContent } from '../components/token-content'

export default function LayerStyles() {
  const textStyles = flattenLayerStyles(config.layerStyles)

  return (
    <TokenGroup>
      <TokenContent>
        {textStyles ? (
          textStyles.map(([name, styles]) => (
            <panda.div
              borderTop="solid 1px"
              borderColor="rgba(128, 128, 128, 0.671)"
              paddingX="1"
              paddingY="2.5"
              css={{
                '&:last-of-type': {
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                },
              }}
              key={name}
            >
              <panda.div borderColor="card">
                <panda.span fontWeight="medium">{name}</panda.span>
                <panda.div fontSize="small" flex="auto" marginTop="1.5">
                  {Object.entries(styles).map(([attr, value], i, arr) => (
                    <span key={attr}>{`${attr}: ${value}${i === arr.length - 1 ? '' : ', '}`}</span>
                  ))}
                </panda.div>
              </panda.div>
              <panda.div
                paddingX="4"
                paddingY="2"
                border="solid 1px"
                borderColor="rgba(128, 128, 128, 0.671)"
                background="#1d1d1e1a"
                marginTop="5"
              >
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
