import * as React from 'react'
import { layerStyles } from 'virtual:panda'
import { panda } from '../../styled-system/jsx'
import * as context from '../lib/panda-context'
import { EmptyState } from './empty-state'
import { LayerStylesIcon } from './icons'
import { TokenContent } from './token-content'
import { TokenGroup } from './token-group'

export default function LayerStyles() {
  const keys = Object.keys(context.layerStyles)

  return (
    <TokenGroup>
      <TokenContent divideY="1px" divideColor="card">
        {keys && keys?.length !== 0 ? (
          keys.map((name) => (
            <panda.div px="1" py="2.5" key={name}>
              <panda.div borderColor="card">
                <panda.span fontWeight="medium">{name}</panda.span>
              </panda.div>
              <panda.div px="4" py="2" background="card" marginTop="5">
                <panda.div flex="auto" my="3" height="20" className={`virtual-layer-style-${name}`} />
                <style
                  dangerouslySetInnerHTML={{
                    __html: `.virtual-layer-style-${name} { ${layerStyles[name]} }`,
                  }}
                />
              </panda.div>
            </panda.div>
          ))
        ) : (
          <EmptyState title="No Layer Styles" icon={<LayerStylesIcon />}>
            The panda config does not contain any layer styles
          </EmptyState>
        )}
      </TokenContent>
    </TokenGroup>
  )
}
