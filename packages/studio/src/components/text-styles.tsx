import { walkObject } from '@pandacss/shared'
import type { Dict, TextStyles as TextStylesType } from '@pandacss/types'
import { config } from 'virtual:panda'
import { EmptyState } from './empty-state'
import { TextStylesIcon } from './icons'
import { panda } from '../../styled-system/jsx'
import { TokenGroup } from './token-group'
import { TokenContent } from './token-content'
import { customDocs } from '../utils/custom-docs'

export function TextStyles() {
  //@ts-expect-error
  const textStyles = flattenTextStyles(config.theme?.textStyles ?? {})

  return (
    <TokenGroup>
      <TokenContent divideY="1px" divideColor="card">
        {textStyles && textStyles?.length !== 0 ? (
          textStyles.map(([name, styles]) => (
            <panda.div paddingX="1" paddingY="2.5" key={name}>
              <panda.div borderColor="card">
                <panda.span fontWeight="medium">{name}</panda.span>
              </panda.div>
              <panda.div flex="auto" marginY="3" style={styles} truncate>
                {customDocs.title} textStyles are time saving
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
