import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react'
import { useState } from 'react'
import { getContrastPairs, getContrastRatio } from '../utilities/color'
import { Colors } from './color-docs'
import { ErrorIcon, SuccessIcon } from './icons'

type ContrastCheckerProps = {
  colors: Colors
}

export function ContrastChecker(props: ContrastCheckerProps) {
  const { colors: colorsObj } = props
  const colors = Object.entries(colorsObj)
    .map(([color, shadesOrValue]) =>
      typeof shadesOrValue === 'string'
        ? { label: color, value: shadesOrValue }
        : Object.entries(shadesOrValue as any).map(([shade, value]) => ({ label: `${color}.${shade}`, value })),
    )
    .flat()

  const [foreground, setForeGround] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')

  const activeForeground = (colors.find((col) => col.label === foreground)?.value || foreground) as string
  const activeBackground = (colors.find((col) => col.label === background)?.value || background) as string

  const WCAGTests = getContrastPairs(activeForeground, activeBackground)
  const constrastRatio = getContrastRatio(activeForeground, activeBackground)

  const renderTestScore = (score: { WCAG_AA: boolean; WCAG_AAA: boolean }, size: 'regular' | 'large') => {
    return (
      <>
        <div>
          <div>
            <span>{score.WCAG_AA ? <SuccessIcon /> : <ErrorIcon />}</span>
            <span>AA</span>
          </div>
          <span>{size === 'regular' ? '4.5:1' : '3:1'}</span>
        </div>
        <div>
          <div>
            <span>{score.WCAG_AAA ? <SuccessIcon /> : <ErrorIcon />}</span>
            <span>AAA</span>
          </div>
          <span>{size === 'regular' ? '7:1' : '4.5:1'}</span>
        </div>
      </>
    )
  }

  return (
    <div className="token-group contrast-checker">
      <div className="token-content ">
        <div className="color-container">
          <div style={{ background: activeForeground }}>
            <VSCodeDropdown value={foreground} onChange={(e: any) => setForeGround(e.currentTarget.value)}>
              {colors.map((color) => (
                <VSCodeOption key={color.label} value={color.label}>
                  {color.label}
                </VSCodeOption>
              ))}
            </VSCodeDropdown>
          </div>
          <div style={{ background: activeBackground }}>
            <VSCodeDropdown value={background} onChange={(e: any) => setBackground(e.currentTarget.value)}>
              {colors.map((color) => (
                <VSCodeOption key={color.label} value={color.label}>
                  {color.label}
                </VSCodeOption>
              ))}
            </VSCodeDropdown>
          </div>
        </div>

        <div
          className="preview"
          suppressContentEditableWarning
          contentEditable
          style={{ background: activeBackground, color: activeForeground }}
        >
          example text showing contrast
        </div>

        <div className="result">
          <div className="contrast-ratio">
            <span>{constrastRatio ? `${constrastRatio?.toFixed(2).replace(/[.,]00$/, '')}:1` : ':'}</span>
            <span>Contrast ratio</span>
          </div>
          <div className="test-scores">
            <div>
              <span>Normal Text</span>
              {renderTestScore(WCAGTests[0], 'regular')}
            </div>
            <div>
              <span>Large Text</span>
              {renderTestScore(WCAGTests[1], 'large')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
