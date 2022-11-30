import { walkObject } from '@pandacss/shared'
import type { Dict, TextStyles as TextStylesType } from '@pandacss/types'
import { config } from 'virtual:panda'
import { EmptyState } from '../components/empty-state'
import { TextStylesIcon } from '../components/icons'
import { panda } from 'design-system/jsx'
import { TokenGroup } from '../components/token-group'
import { TokenContent } from '../components/token-content'

export default function TextStyles() {
  const textStyles = flattenTextStyles(config.textStyles)

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
              <panda.div
                osLight={{
                  borderColor: 'card',
                }}
              >
                <panda.span fontWeight="medium">{name}</panda.span>
                <panda.div fontSize="small" flex="auto" marginTop="1.5">
                  {Object.entries(styles).map(([attr, value], i, arr) => (
                    <span key={attr}>{`${attr}: ${value}${i === arr.length - 1 ? '' : ', '}`}</span>
                  ))}
                </panda.div>
              </panda.div>
              <panda.div flex="auto" marginY="3" style={styles}>
                Panda CSS textStyles are time saving
              </panda.div>
            </panda.div>
          ))
        ) : (
          <EmptyState title="No Text Styles" icon={<TextStylesIcon />}>
            The config does not contain any Text Styles
          </EmptyState>
        )}
      </TokenContent>
    </TokenGroup>
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
