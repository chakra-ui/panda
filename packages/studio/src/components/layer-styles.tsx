import { panda } from '../../styled-system/jsx'
import context from '../lib/panda.context'
import { EmptyState } from './empty-state'
import { LayerStylesIcon } from './icons'
import { TokenContent } from './token-content'
import { TokenGroup } from './token-group'

export function LayerStyles() {
  const layerStyles = Object.entries(context.layerStyles)

  return (
    <TokenGroup>
      <TokenContent divideY="1px" divideColor="card">
        {layerStyles && layerStyles?.length !== 0 ? (
          layerStyles.map(([name, styles]) => (
            <panda.div px="1" py="2.5" key={name}>
              <panda.div borderColor="card">
                <panda.span fontWeight="medium">{name}</panda.span>
                <panda.div fontSize="small" flex="auto" marginTop="1.5">
                  {Object.entries(styles).map(([attr, value], i, arr) => (
                    <span key={attr}>{`${attr}: ${value}${i === arr.length - 1 ? '' : ', '}`}</span>
                  ))}
                </panda.div>
              </panda.div>
              <panda.div px="4" py="2" background="card" marginTop="5">
                <panda.div flex="auto" my="3" height="20" style={styles} />
              </panda.div>
            </panda.div>
          ))
        ) : (
          <EmptyState title="No Layer Styles" icon={<LayerStylesIcon />}>
            The config does not contain any Layer Styles
          </EmptyState>
        )}
      </TokenContent>
    </TokenGroup>
  )
}
