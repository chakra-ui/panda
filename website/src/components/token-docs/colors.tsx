'use client'

import { css } from '@/styled-system/css'
import { useClipboard } from '@ark-ui/react/clipboard'
import { LuCheck } from 'react-icons/lu'
import { baseColors, colorScales, colorShades, type Token } from './query'

/** One row per hue, shades left to right, matching how the preset orders the palette. */
export const Colors = () => {
  const clipboard = useClipboard({ timeout: 1500 })
  const copied = clipboard.copied ? clipboard.value : null

  const copy = (token: Token) => {
    clipboard.setValue(token.extensions.prop)
    clipboard.copy()
  }

  return (
    <div className={grid}>
      <div />
      {colorShades.map(shade => (
        <div key={shade} className={shadeLabel}>
          {shade}
        </div>
      ))}

      {colorScales.map(scale => (
        <ColorRow
          key={scale.key}
          name={scale.key}
          tokens={scale.values}
          copied={copied}
          onCopy={copy}
        />
      ))}
      <ColorRow name="base" tokens={baseColors} copied={copied} onCopy={copy} />
    </div>
  )
}

interface ColorRowProps {
  name: string
  tokens: Token[]
  copied: string | null
  onCopy: (token: Token) => void
}

const ColorRow = (props: ColorRowProps) => {
  const { name, tokens, copied, onCopy } = props
  return (
    <>
      <div className={hueLabel}>{name}</div>
      {tokens.map(token => (
        <button
          key={token.name}
          type="button"
          title={token.extensions.prop}
          aria-label={`Copy ${token.extensions.prop}`}
          data-copied={copied === token.extensions.prop || undefined}
          onClick={() => onCopy(token)}
          className={swatch}
          style={{ background: token.extensions.varRef }}
        >
          {copied === token.extensions.prop && <LuCheck className={check} />}
        </button>
      ))}
      {Array.from({ length: colorShades.length - tokens.length }, (_, i) => (
        <div key={i} />
      ))}
    </>
  )
}

const grid = css({
  display: 'grid',
  gridTemplateColumns: '5.5rem repeat(11, minmax(0, 1fr))',
  columnGap: '1',
  rowGap: '2',
  alignItems: 'center',
  fontSize: 'sm'
})

const hueLabel = css({
  fontWeight: 'medium',
  textTransform: 'capitalize',
  pe: '2'
})

const shadeLabel = css({
  textAlign: 'center',
  fontSize: 'xs',
  color: 'fg.subtle',
  fontFamily: 'mono'
})

const swatch = css({
  display: 'grid',
  placeItems: 'center',
  aspectRatio: '1',
  width: '100%',
  rounded: 'sm',
  borderWidth: '1px',
  borderColor: 'border',
  cursor: 'pointer',
  transition: 'transform 0.1s',
  _hover: { transform: 'scale(1.1)' },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'fg',
    outlineOffset: '1px'
  },
  '&[data-copied]': {
    outline: '2px solid',
    outlineColor: 'fg',
    outlineOffset: '1px'
  }
})

/** Difference blending keeps the check visible on both the 50 and 950 shades. */
const check = css({
  width: '60%',
  height: '60%',
  color: 'white',
  mixBlendMode: 'difference'
})
