import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import type { TokenExtensions } from '@pandacss/token-dictionary'
import { SemanticToken } from '../../src/components/colors'
import rawSemanticTokens from '../fixtures/semantic-tokens-park-ui.json'

const semanticTokens = rawSemanticTokens as [string, TokenExtensions][]

describe('SemanticToken', () => {
  it('should render semantic tokens without base token', () => {
    const { container } = render(
      <>
        {semanticTokens.map(([name, token]) => (
          <SemanticToken key={name} name={name} tokens={token} />
        ))}
      </>,
    )

    expect(container.firstChild).toMatchInlineSnapshot()
  })
})
