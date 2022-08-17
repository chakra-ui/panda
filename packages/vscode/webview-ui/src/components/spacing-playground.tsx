import {
  VSCodeDropdown,
  VSCodeOption,
  VSCodePanels,
  VSCodePanelTab,
  VSCodePanelView,
} from '@vscode/webview-ui-toolkit/react'
import { useState } from 'react'
import type { Config } from '@css-panda/types'
import { getSortedSizes } from '../utilities/sizes-sort'
import { renderPixels } from './size-docs'

export type SpacingPlaygroundProps = { sizes: NonNullable<Config['tokens']>['sizes'] }

const NUMBER_OF_ITEMS = 3

export function SpacingPlayground(props: SpacingPlaygroundProps) {
  const { sizes: sizesProp } = props
  if (typeof sizesProp === 'string') return null
  const sizes = getSortedSizes(sizesProp) as unknown as string[]

  const [gapSize, setGapSize] = useState(sizes[6]?.[0])
  const gap = sizesProp[gapSize] as string

  const [paddingSize, setPaddingSize] = useState(sizes[6]?.[0])
  const padding = sizesProp[paddingSize] as string

  return (
    <div className="token-group spacing-playground">
      <VSCodePanels>
        <VSCodePanelTab id="gap">Gap</VSCodePanelTab>
        <VSCodePanelTab id="padding">Padding</VSCodePanelTab>
        <VSCodePanelView id="gap-view">
          <div className="token-content ">
            <div className="switch">
              <span>Spacing</span>
              <VSCodeDropdown
                value={gapSize}
                onChange={(e) => {
                  const event = e as React.FormEvent<HTMLInputElement>
                  setGapSize(event.currentTarget.value)
                }}
                className="token-switch"
              >
                {sizes.map(([name, sizeValue]) => (
                  <VSCodeOption key={sizeValue} value={name}>
                    {name}
                    {sizeValue.endsWith('px') ? '' : ` - ${renderPixels(sizeValue)}`}
                  </VSCodeOption>
                ))}
              </VSCodeDropdown>
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
        </VSCodePanelView>

        <VSCodePanelView id="padding-view">
          <div className="token-content ">
            <div className="switch">
              <span>Spacing</span>
              <VSCodeDropdown
                value={paddingSize}
                onChange={(e) => {
                  const event = e as React.FormEvent<HTMLInputElement>
                  setPaddingSize(event.currentTarget.value)
                }}
                className="token-switch"
              >
                {sizes.map(([name, sizeValue]) => (
                  <VSCodeOption key={sizeValue} value={name}>
                    {name}
                    {sizeValue.endsWith('px') ? '' : ` - ${renderPixels(sizeValue)}`}
                  </VSCodeOption>
                ))}
              </VSCodeDropdown>
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
        </VSCodePanelView>
      </VSCodePanels>
    </div>
  )
}
