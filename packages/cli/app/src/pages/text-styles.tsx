import { walkObject } from '@pandacss/shared'
import type { Dict, TextStyles as TextStylesType } from '@pandacss/types'
import { config } from 'virtual:panda'
import { EmptyState } from '../components/empty-state'

export default function TextStyles() {
  const textStyles = flattenTextStyles(config.textStyles)

  return (
    <div className="token-group text-styles">
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
              <div className="preview" style={styles}>
                Panda CSS textStyles are time saving
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No Text Styles"
            icon={
              <svg width="48" height="1em" viewBox="0 0 48 30">
                <path
                  d="M0 29.16H4.56L6.96 22.36H19.88L22.28 29.16H26.84L16.48 0H10.36L0 29.16ZM8 18.96L11.28 9.96L13.32 4H13.56L15.6 9.96L18.8 18.96H8Z"
                  fill="currentColor"
                />
                <path
                  d="M35.7959 29.52C39.3559 29.52 41.9959 27.68 42.9959 24.96H43.2359V29.16H47.3559V8H43.3959L43.2359 12.16H42.9959C41.9959 9.44 39.3559 7.64 35.7959 7.64C30.6359 7.64 27.1559 11.48 27.1559 18.56C27.1559 25.64 30.6359 29.52 35.7959 29.52ZM37.2359 26.12C33.7159 26.12 31.3959 23.52 31.3959 18.56C31.3959 13.56 33.7159 11 37.2359 11C41.1559 11 43.1959 14.12 43.1959 17.36V19.76C43.1959 23.04 41.1559 26.12 37.2359 26.12Z"
                  fill="currentColor"
                />
              </svg>
            }
          >
            The config does not contain any Text Styles
          </EmptyState>
        )}
      </div>
    </div>
  )
}

function flattenTextStyles(values: TextStylesType | undefined) {
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
