import { useState } from 'react'
import { Stack, panda } from '../../styled-system/jsx'
import context from '../lib/panda.context'
import { TokenContent } from './token-content'
import { TokenGroup } from './token-group'

const getFirstToken = <T extends Map<string, any>>(token: T) => Array.from(token.values())[0].extensions.prop
const tokens = Object.fromEntries(context.tokens.categoryMap)

const defaultConfig = {
  fontSize: getFirstToken(tokens.fontSizes),
  letterSpacing: getFirstToken(tokens.letterSpacings),
  fontWeight: getFirstToken(tokens.fontWeights),
  lineHeight: getFirstToken(tokens.lineHeights),
}

export function TypographyPlayground() {
  const [config, setConfig] = useState(defaultConfig)
  const configValues = Object.entries(config).reduce(
    (acc, [token, label]) => ({
      ...acc,
      [token]: tokens[`${token}s`].get(label)?.value,
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
    const values = Array.from(tokens[`${token}s`].values())
    return (
      <panda.select background="card" value={config[token]} onChange={(e) => onChangeConfig(e, token)}>
        {values.map((token) => (
          <option key={token.value} value={token.extensions.prop}>
            {`${token.extensions.prop} (${token.value})`}
          </option>
        ))}
      </panda.select>
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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
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
