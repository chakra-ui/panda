import { useState } from 'react'
import type { Config } from '@css-panda/types'
import { TokenDictionary } from '@css-panda/token-dictionary'

type TypographyPlaygroundProps = { config: Config }

export function TypographyPlayground(props: TypographyPlaygroundProps) {
  const { config: configP } = props

  const tokenMap = new TokenDictionary(configP)
  const tokens = Object.fromEntries(tokenMap.categoryMap)

  const getFirstToken = <T extends Map<string, any>>(token: T) => Array.from(token.values())[0].value

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
    <div className="token-group">
      <div className="token-content">
        <div className="typography-playground">
          <div contentEditable="true" style={configValues}>
            Panda
          </div>
          <div className="controls">
            {Object.keys(config).map((tokenKey) => (
              <div className="control">
                <span>{tokenKey.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}</span>
                {renderTokenSwitch(tokenKey as keyof typeof defaultConfig)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
