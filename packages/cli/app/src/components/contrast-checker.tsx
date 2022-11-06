import { useState } from 'react'
import { getContrastPairs, getContrastRatio } from '../utils/color'
import { ErrorIcon, SuccessIcon } from './icons'

type ContrastCheckerProps = {
  colors: Map<string, any>
}

export function ContrastChecker(props: ContrastCheckerProps) {
  const { colors: colorsMap } = props
  const values = Array.from(colorsMap.values())

  const colors = values
    .filter((color) => !color.isConditional && !color.extensions.isVirtual)
    .map((color) => ({
      label: color.extensions.prop,
      value: color.value,
    }))

  const [foreground, setForeGround] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')

  const activeForeground = (colors.find((col) => col.label === foreground)?.value || foreground) as string
  const activeBackground = (colors.find((col) => col.label === background)?.value || background) as string

  const wcag = getContrastPairs(activeForeground, activeBackground)
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
            <select value={foreground} onChange={(e: any) => setForeGround(e.currentTarget.value)}>
              {colors.map((color) => (
                <option key={color.label} value={color.label}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ background: activeBackground }}>
            <select value={background} onChange={(e: any) => setBackground(e.currentTarget.value)}>
              {colors.map((color) => (
                <option key={color.label} value={color.label}>
                  {color.label}
                </option>
              ))}
            </select>
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
          {wcag && (
            <div className="test-scores">
              <div>
                <span>Normal Text</span>
                {renderTestScore(wcag[0], 'regular')}
              </div>
              <div>
                <span>Large Text</span>
                {renderTestScore(wcag[1], 'large')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
