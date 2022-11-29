import { walkObject } from '@pandacss/shared'
import type { Dict, TextStyles as TextStylesType } from '@pandacss/types'
import { config } from 'virtual:panda'
import { EmptyState } from '../components/empty-state'
import { TextStylesIcon } from '../components/icons'
import { panda } from 'design-system/jsx'

export default function TextStyles() {
  const textStyles = flattenTextStyles(config.textStyles)

  return (
    <panda.div layerStyle="token-group">
      <panda.div gap="0" layerStyle="token-content">
        {textStyles ? (
          textStyles.map(([name, styles]) => (
            <panda.div
              borderTop="solid 1px"
              borderColor="rgba(128, 128, 128, 0.671)"
              padding="10px 4px"
              css={{
                '&:last-of-type': {
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                },
              }}
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
              <panda.div flex="auto" margin="12px 0" style={styles}>
                Panda CSS textStyles are time saving
              </panda.div>
            </panda.div>
          ))
        ) : (
          <EmptyState title="No Text Styles" icon={<TextStylesIcon />}>
            The config does not contain any Text Styles
          </EmptyState>
        )}
      </panda.div>
    </panda.div>
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
