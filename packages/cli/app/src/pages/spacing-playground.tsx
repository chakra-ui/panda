import { useState } from 'react'
import { getSortedSizes } from '../utils/sizes-sort'
import { renderPixels } from './sizes'
import { config } from 'virtual:panda'
import { TokenDictionary } from '@css-panda/token-dictionary'

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

  return (
    <div className="token-group spacing-playground">
      <div>
        <h3 id="gap">Gap</h3>
        <div id="gap-view">
          <div className="token-content ">
            <div className="switch">
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
            </div>

            <div className="section">
              <span>Horizontal</span>
              <div className="stack-v" style={{ gap }}>
                {Array.from({ length: NUMBER_OF_ITEMS }).map((_, i) => (
                  <div className="spacing-item" key={i}>
                    {i < 10 ? 0 : ''}
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="section">
              <span>Vertical</span>
              <div className="stack-h" style={{ gap }}>
                {Array.from({ length: NUMBER_OF_ITEMS }).map((_, i) => (
                  <div className="spacing-item" key={i}>
                    {i < 10 ? 0 : ''}
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <hr />

        <h3 id="padding">Padding</h3>
        <div id="padding-view">
          <div className="token-content ">
            <div className="switch">
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
            </div>

            <div className="section">
              <span>Horizontal</span>
              <div className="pad-h pad" style={{ paddingInline: padding }}>
                <div className="padding-item">{padding}</div>
              </div>
            </div>

            <div className="section">
              <span>Vertical</span>
              <div className="pad-v pad" style={{ padding: `${padding} 0` }}>
                <div className="padding-item">{padding}</div>
              </div>
            </div>

            <div className="section">
              <span>All sides</span>
              <div className="pad-all pad" style={{ padding }}>
                <div className="padding-item">{padding}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
