import { walkObject } from '@css-panda/shared'
import type { Dict, TextStyles as TextStylesType } from '@css-panda/types'

export type TextStylesProps = { textStyles: TextStylesType | undefined }

export function TextStyles(props: TextStylesProps) {
  const { textStyles: rawTextStyles } = props

  const textStyles = flattenTextStyles(rawTextStyles)

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
          <div> No textStyles in panda config! </div>
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
