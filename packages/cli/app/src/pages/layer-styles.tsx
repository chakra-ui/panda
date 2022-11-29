import { walkObject } from '@pandacss/shared'
import type { Dict, LayerStyles as LayerStylesType } from '@pandacss/types'
import { config } from 'virtual:panda'
import { EmptyState } from '../components/empty-state'
import { LayerStylesIcon } from '../components/icons'
import { panda } from 'design-system/jsx'
import { css } from 'design-system/css'

export default function LayerStyles() {
  const textStyles = flattenLayerStyles(config.layerStyles)

  return (
    <panda.div layerStyle="token-group">
      <panda.div gap="0" layerStyle="token-content">
        {textStyles ? (
          textStyles.map(([name, styles]) => (
            <panda.div
              borderTop="solid 1px"
              borderColor="rgba(128, 128, 128, 0.671)"
              padding="10px 4px"
              className={css({
                '&:last-of-type': {
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                },
              })}
              key={name}
            >
              <panda.div
                osLight={{
                  borderColor: 'var(--aside-bg)',
                }}
              >
                <panda.span fontWeight={500}>{name}</panda.span>
                <panda.div fontSize="small" flex="auto" marginTop="6px">
                  {Object.entries(styles).map(([attr, value], i, arr) => (
                    <span key={attr}>{`${attr}: ${value}${i === arr.length - 1 ? '' : ', '}`}</span>
                  ))}
                </panda.div>
              </panda.div>
              <panda.div
                padding="8px 16px"
                border="solid 1px"
                borderColor="rgba(128, 128, 128, 0.671)"
                background="#1d1d1e1a"
                marginTop="20px"
                className="preview-wrapper"
              >
                <panda.div flex="auto" margin="12px 0" height="5em" style={styles} />
              </panda.div>
            </panda.div>
          ))
        ) : (
          <EmptyState title="No Layer Styles" icon={<LayerStylesIcon />}>
            The config does not contain any Layer Styles
          </EmptyState>
        )}
      </panda.div>
    </panda.div>
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
