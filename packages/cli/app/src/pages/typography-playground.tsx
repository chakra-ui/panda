import { useState } from 'react'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { config as configP } from 'virtual:panda'
import { panda } from 'design-system/jsx'

export default function TypographyPlayground() {
  const tokenMap = new TokenDictionary(configP)
  const tokens = Object.fromEntries(tokenMap.categoryMap)

  const getFirstToken = <T extends Map<string, any>>(token: T) => Array.from(token.values())[0].extensions.prop

  const defaultConfig = {
    fontSize: getFirstToken(tokens.fontSizes),
    letterSpacing: getFirstToken(tokens.letterSpacings),
    fontWeight: getFirstToken(tokens.fontWeights),
    lineHeight: getFirstToken(tokens.lineHeights),
  }

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
      <select value={config[token]} onChange={(e) => onChangeConfig(e, token)} className="token-switch">
        {values.map((token) => (
          <option key={token.value} value={token.extensions.prop}>
            {`${token.extensions.prop} (${token.value})`}
          </option>
        ))}
      </select>
    )
  }

  return (
    <panda.div layerStyle="token-group">
      <panda.div layerStyle="token-content">
        <div>
          <panda.div
            contentEditable="true"
            outline="0px solid transparent"
            paddingTop="100px"
            paddingBottom="100px"
            marginInlineStart="auto"
            marginInlineEnd="auto"
            suppressContentEditableWarning={true}
            width="fit-content"
            style={configValues}
          >
            Panda
          </panda.div>
          <panda.div display="flex" flexDirection="column" gap="12px">
            {Object.keys(config).map((tokenKey) => (
              <panda.div diaplay="flex" alignItems="center" gap="6px" key={tokenKey}>
                <panda.span whiteSpace="nowrap" width="200px" textTransform="capitalize" marginRight="2">
                  {tokenKey.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}
                </panda.span>
                {renderTokenSwitch(tokenKey as keyof typeof defaultConfig)}
              </panda.div>
            ))}
          </panda.div>
        </div>
      </panda.div>
    </panda.div>
  )
}
