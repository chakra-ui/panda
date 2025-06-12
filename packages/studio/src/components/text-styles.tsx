import { textStyles } from 'virtual:panda'
import { panda } from '../../styled-system/jsx'
import * as context from '../lib/panda-context'
import { EmptyState } from './empty-state'
import { TextStylesIcon } from './icons'
import { TokenContent } from './token-content'
import { TokenGroup } from './token-group'

export default function TextStyles() {
  const keys = Object.keys(context.textStyles)

  return (
    <TokenGroup>
      <TokenContent>
        {keys?.length !== 0 ? (
          keys.map((name) => (
            <panda.div px="1" py="2.5" key={name}>
              <panda.div borderColor="card">
                <panda.span fontWeight="medium">{name}</panda.span>
              </panda.div>
              <panda.div flex="auto" my="3" className={`virtual-text-style-${name}`} truncate>
                Panda textStyles are time saving
              </panda.div>
              <style
                dangerouslySetInnerHTML={{
                  __html: `.virtual-text-style-${name} { ${textStyles[name]} }`,
                }}
              />
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
