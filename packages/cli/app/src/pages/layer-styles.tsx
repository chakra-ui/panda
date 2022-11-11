import { walkObject } from '@css-panda/shared'
import type { Dict, LayerStyles as LayerStylesType } from '@css-panda/types'
import { config } from 'virtual:panda'

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
          <div> No layerStyles in panda config! </div>
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
