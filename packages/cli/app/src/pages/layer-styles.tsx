import { walkObject } from '@pandacss/shared'
import type { Dict, LayerStyles as LayerStylesType } from '@pandacss/types'
import { config } from 'virtual:panda'
import { EmptyState } from '../components/empty-state'

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
          <EmptyState
            title="No Layer Styles"
            icon={
              <svg width="1em" height="1em" viewBox="0 0 24 24">
                <title>paint-brush</title>
                <g
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  strokeMiterlimit="10"
                >
                  <polyline
                    points="15.021,18.879 22.092,11.808 19.971,9.686 17.142,9.686 17.142,6.858 12.192,1.908 5.121,8.979 "
                    strokeLinecap="butt"
                    stroke="currentColor"
                  />
                  <path d="M4.414,9.686 c-1.202,1.202-1.202,3.041,0,4.243l1.414,1.414l-4.172,4.172c-0.707,0.707-0.849,1.838-0.283,2.687 c0.778,1.061,2.192,1.061,3.041,0.212l4.243-4.243l1.414,1.414c1.202,1.202,3.041,1.202,4.243,0l0.707-0.707L5.121,8.979 L4.414,9.686z"></path>
                </g>
              </svg>
            }
          >
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
