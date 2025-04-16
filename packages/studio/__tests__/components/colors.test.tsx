import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import type { TokenExtensions } from '@pandacss/token-dictionary'
import { SemanticToken, sortSemanticTokens } from '../../src/components/colors'
import rawSemanticTokens from '../fixtures/semantic-tokens-park-ui.json'

const semanticTokens = rawSemanticTokens as [string, TokenExtensions][]

describe('sortSemanticTokens', () => {
  it('should sort tokens', () => {
    const tokens = ['c', '_dark', 'a', '_light', 'base', 'b']
    const expected = ['base', '_light', '_dark', 'a', 'b', 'c']
    expect(sortSemanticTokens(tokens)).toEqual(expected)
  })
})

describe('SemanticToken', () => {
  it('should render semantic tokens', () => {
    const token = {
      base: { value: '#fff' },
      dark: { value: '#000' },
      extensions: {
        conditions: {
          base: '#fff',
          dark: '#000',
        },
      },
    } as any

    const { container } = render(<SemanticToken name="bg.default" tokens={token} />)

    expect(container.textContent).toBe('base#fff dark#000 bg.default')
  })

  it('should render semantic tokens without base token', () => {
    const { container } = render(
      <>
        {semanticTokens.map(([name, token]) => (
          <SemanticToken key={name} name={name} tokens={token} />
        ))}
      </>,
    )

    expect(container.firstChild?.textContent).toBe('lightvar(--colors-gray-1) darkvar(--colors-gray-1) bg.canvas')
  })
})
