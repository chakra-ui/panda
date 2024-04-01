import * as React from 'react'
import { panda } from '../../styled-system/jsx'
import * as context from '../lib/panda-context'
import { EmptyState } from './empty-state'
import { TextStylesIcon } from './icons'
import { TokenContent } from './token-content'
import { TokenGroup } from './token-group'
import type { Dict } from '../../styled-system/types'

export default function TextStyles() {
  const textStyles = Object.entries(context.textStyles)

  return (
    <TokenGroup>
      <TokenContent>
        {textStyles?.length !== 0 ? (
          textStyles.map(([name, styles]) => (
            <panda.div px="1" py="2.5" key={name}>
              <panda.div borderColor="card">
                <panda.span fontWeight="medium">{name}</panda.span>
              </panda.div>
              <panda.div flex="auto" my="3" style={removeEscapeHatchSyntax(styles)} truncate>
                Panda textStyles are time saving
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

const removeEscapeHatchSyntax = (styles: Dict) => {
  return Object.fromEntries(
    Object.entries(styles).map(([key, value]) => {
      if (typeof value === 'string' && value[0] === '[' && value[value.length - 1] === ']') {
        return [key, value.slice(1, -1)]
      }

      return [key, value]
    }),
  )
}
