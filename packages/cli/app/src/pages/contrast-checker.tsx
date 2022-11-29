import { useState } from 'react'
import { getContrastPairs, getContrastRatio } from '../utils/color'
import { ErrorIcon, SuccessIcon } from '../components/icons'
import { config } from 'virtual:panda'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { panda } from 'design-system/jsx'
import { css } from 'design-system/css'

export default function ContrastChecker() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)

  const { colors: colorsMap } = tokens
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
    <panda.div layerStyle="token-group">
      <panda.div layerStyle="token-content ">
        <panda.div display="flex" alignItems="center" gap="12px" padding="8px" className="color-container">
          <panda.div
            display="flex"
            flexDirection="column"
            border="solid 1px rgba(182, 180, 180, 0.1)"
            flex="1"
            paddingTop="60px"
            style={{ background: activeForeground }}
          >
            <select value={foreground} onChange={(e: any) => setForeGround(e.currentTarget.value)}>
              {colors.map((color) => (
                <option key={color.label} value={color.label}>
                  {color.label}
                </option>
              ))}
            </select>
          </panda.div>
          <panda.div
            display="flex"
            flexDirection="column"
            border="solid 1px rgba(182, 180, 180, 0.1)"
            flex="1"
            paddingTop="60px"
            style={{ background: activeBackground }}
          >
            <select value={background} onChange={(e: any) => setBackground(e.currentTarget.value)}>
              {colors.map((color) => (
                <option key={color.label} value={color.label}>
                  {color.label}
                </option>
              ))}
            </select>
          </panda.div>
        </panda.div>

        <panda.div
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontWeight={500}
          fontSize="1.4em"
          padding="8px"
          outline="none"
          border="solid 1px rgba(182, 180, 180, 0.2)"
          suppressContentEditableWarning
          contentEditable
          style={{ background: activeBackground, color: activeForeground }}
        >
          example text showing contrast
        </panda.div>

        <div className="result">
          <panda.div display="flex" flexDirection="column" textAlign="center" gap="10px" className="contrast-ratio">
            <panda.span fontWeight={700} fontSize="2.5em">
              {constrastRatio ? `${constrastRatio?.toFixed(2).replace(/[.,]00$/, '')}:1` : ':'}
            </panda.span>
            <panda.span fontWeight={600} opacity={0.5}>
              Contrast ratio
            </panda.span>
          </panda.div>
          {wcag && (
            <panda.div
              className={css({
                '& > div': {
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                },

                '& > div > span': {
                  fontWeight: 600,
                },

                '& > div > div': {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 500,
                },

                '& > div > div > div': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                },
              })}
              display="flex"
              gap="20px"
              marginTop="40px"
            >
              <div>
                <span>Normal Text</span>
                {renderTestScore(wcag[0], 'regular')}
              </div>
              <div>
                <span>Large Text</span>
                {renderTestScore(wcag[1], 'large')}
              </div>
            </panda.div>
          )}
        </div>
      </panda.div>
    </panda.div>
  )
}
