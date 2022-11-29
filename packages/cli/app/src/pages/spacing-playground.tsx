import { useState } from 'react'
import { getSortedSizes } from '../utils/sizes-sort'
import { renderPixels } from './sizes'
import { config } from 'virtual:panda'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { panda } from 'design-system/jsx'
import { css } from 'design-system/css'

const NUMBER_OF_ITEMS = 3

export default function SpacingPlayground() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)

  const { sizes: sizesProp } = tokens
  const values = Array.from(sizesProp.values())
  if (typeof sizesProp === 'string') return null

  const sizes = getSortedSizes(values)

  const [gapSize, setGapSize] = useState(sizes[6]?.extensions.prop)
  const gap = sizesProp.get(gapSize)?.value

  const [paddingSize, setPaddingSize] = useState(sizes[6]?.extensions.prop)
  const padding = sizesProp.get(paddingSize)?.value

  const spacingItems = Array.from({ length: NUMBER_OF_ITEMS }).map((_, i) => (
    <panda.div
      width="full"
      height="40px"
      background="rgb(99 102 241)"
      borderRadius="0.5rem"
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontWeight="bold"
      key={i}
    >
      {i < 10 ? 0 : ''}
      {i + 1}
    </panda.div>
  ))

  return (
    <panda.div layerStyle="token-group">
      <div>
        <h3 id="gap">Gap</h3>
        <div id="gap-view">
          <panda.div layerStyle="token-content ">
            <panda.div layerStyle="spacing.switch">
              <span>Spacing</span>
              <select
                value={gapSize}
                onChange={(e) => {
                  setGapSize(e.currentTarget.value)
                }}
                className="token-switch"
              >
                {sizes.map((size) => (
                  <option key={size.value} value={size.extensions.prop}>
                    {size.extensions.prop}
                    {size.value.endsWith('px') ? '' : ` - ${renderPixels(size.value)}`}
                  </option>
                ))}
              </select>
            </panda.div>

            <panda.div layerStyle="spacing.section">
              <span>Horizontal</span>
              <panda.div
                display="flex"
                background="#e879f91a"
                backgroundImage="linear-gradient(
                  135deg,
                  #d946ef80 10%,
                  transparent 0,
                  transparent 50%,
                  #d946ef80 0,
                  #d946ef80 60%,
                  transparent 0,
                  transparent
                )"
                backgroundSize="7.07px 7.07px"
                width="fit-content"
                className={css({
                  '& div': {
                    background: 'rgb(217 70 239)',
                    width: '56px',
                    height: '56px',
                  },
                })}
                style={{ gap }}
              >
                {spacingItems}
              </panda.div>
            </panda.div>

            <panda.div layerStyle="spacing.section">
              <span>Vertical</span>
              <panda.div
                display="flex"
                flexDir="column"
                background="#e879f91a"
                backgroundImage="linear-gradient(
                  135deg,
                  #d946ef80 10%,
                  transparent 0,
                  transparent 50%,
                  #d946ef80 0,
                  #d946ef80 60%,
                  transparent 0,
                  transparent
                )"
                backgroundSize="7.07px 7.07px"
                className="stack-h"
                style={{ gap }}
              >
                {spacingItems}
              </panda.div>
            </panda.div>
          </panda.div>
        </div>

        <hr />

        <h3 id="padding">Padding</h3>
        <div id="padding-view">
          <panda.div layerStyle="token-content ">
            <panda.div layerStyle="spacing.switch">
              <span>Spacing</span>
              <select
                value={paddingSize}
                onChange={(e) => {
                  setPaddingSize(e.currentTarget.value)
                }}
                className="token-switch"
              >
                {sizes.map((size) => (
                  <option key={size.value} value={size.extensions.prop}>
                    {size.extensions.prop}
                    {size.value.endsWith('px') ? '' : ` - ${renderPixels(size.value)}`}
                  </option>
                ))}
              </select>
            </panda.div>

            <panda.div layerStyle="spacing.section">
              <span>Horizontal</span>
              <div className="pad-h pad" style={{ paddingInline: padding }}>
                <panda.div className="padding-item" layerStyle="spacing.paddingItem">
                  {padding}
                </panda.div>
              </div>
            </panda.div>

            <panda.div layerStyle="spacing.section">
              <span>Vertical</span>
              <div className="pad-v pad" style={{ padding: `${padding} 0` }}>
                <panda.div className="padding-item" layerStyle="spacing.paddingItem">
                  {padding}
                </panda.div>
              </div>
            </panda.div>

            <panda.div layerStyle="spacing.section">
              <span>All sides</span>
              <div className="pad-all pad" style={{ padding }}>
                <panda.div className="padding-item" layerStyle="spacing.paddingItem">
                  {padding}
                </panda.div>
              </div>
            </panda.div>
          </panda.div>
        </div>
      </div>
    </panda.div>
  )
}
