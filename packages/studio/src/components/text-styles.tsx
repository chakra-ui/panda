import { panda } from '../../styled-system/jsx'
import context from '../lib/panda.context'
import { EmptyState } from './empty-state'
import { TextStylesIcon } from './icons'
import { TokenContent } from './token-content'
import { TokenGroup } from './token-group'

export function TextStyles() {
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
              <panda.div flex="auto" my="3" style={styles} truncate>
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
