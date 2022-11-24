import { walkObject } from '@pandacss/shared'
import type { Dict, LayerStyles as LayerStylesType } from '@pandacss/types'
import { config } from 'virtual:panda'
import { EmptyState } from '../components/empty-state'
import { LayerStylesIcon } from '../components/icons'

export default function LayerStyles() {
  const textStyles = flattenLayerStyles(config.layerStyles)

  return (
    <div className="token-group layer-styles">
      <div className="token-content">
        {textStyles ? (
          textStyles.map(([name, styles]) => (
            <div className="item" key={name}>
              <div className="description">
                <span className="name">{name}</span>
                <div className="styles">
                  {Object.entries(styles).map(([attr, value], i, arr) => (
                    <span key={attr}>{`${attr}: ${value}${i === arr.length - 1 ? '' : ', '}`}</span>
                  ))}
                </div>
              </div>
              <div className="preview-wrapper">
                <div className="preview" style={styles} />
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="No Layer Styles" icon={<LayerStylesIcon />}>
            The config does not contain any Layer Styles
          </EmptyState>
        )}
      </div>
    </div>
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
