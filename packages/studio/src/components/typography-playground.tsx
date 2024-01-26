import type { Token } from '@pandacss/token-dictionary'
import * as React from 'react'
import { useState } from 'react'
import { Stack, panda } from '../../styled-system/jsx'
import * as context from '../lib/panda-context'
import { Select } from './input'
import { TokenContent } from './token-content'
import { TokenGroup } from './token-group'

const tokens = Object.fromEntries<Map<string, Token> | undefined>(context.tokens.view.categoryMap)

const defaultConfig = {
  fontSize: '',
  letterSpacing: '',
  fontWeight: '',
  lineHeight: '',
}

export default function TypographyPlayground() {
  const [config, setConfig] = useState(defaultConfig)

  const configValues = Object.entries(config).reduce(
    (acc, [token, label]) => ({
      ...acc,
      [token]: tokens[`${token}s`]?.get(label)?.value,
    }),
    {},
  )

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const onChangeConfig = (e: Event | React.FormEvent<HTMLElement>, key: string) => {
    const event = e as React.FormEvent<HTMLInputElement>
    updateConfig(key, event.currentTarget.value)
  }

  const renderTokenSwitch = (token: keyof typeof defaultConfig) => {
    const currentTokens = tokens[`${token}s`]
    if (!currentTokens) return
    const values = Array.from(currentTokens.values())
    return (
      <Select value={config[token]} onChange={(e) => onChangeConfig(e, token)}>
        {values.map((token) => (
          <option key={token.value} value={token.extensions.prop}>
            {`${token.extensions.prop} (${token.value})`}
          </option>
        ))}
      </Select>
    )
  }

  return (
    <TokenGroup>
      <TokenContent>
        <div>
          <panda.div
            contentEditable
            outline="0"
            pt="28"
            pb="28"
            mx="auto"
            suppressContentEditableWarning={true}
            width="fit-content"
            style={configValues}
          >
            Write type-safe styles with ease using Panda CSS
          </panda.div>

          <Stack gap="4">
            {Object.keys(config).map((tokenKey) => (
              <panda.div display="flex" alignItems="center" gap="1.5" key={tokenKey}>
                <panda.span whiteSpace="nowrap" width="48" textTransform="capitalize" mr="2">
                  {tokenKey.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}
                </panda.span>
                {renderTokenSwitch(tokenKey as keyof typeof defaultConfig)}
              </panda.div>
            ))}
          </Stack>
        </div>
      </TokenContent>
    </TokenGroup>
  )
}
