import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { useEffect, useState } from 'react';
import { Config } from '../types';

type TypographyPlaygroundProps = { config: Config };

export function TypographyPlayground(props: TypographyPlaygroundProps) {
  const { config: configProp } = props;

  const getFirstValue = <T extends Record<any, any>>(obj: T) => Object.values(obj)[0];

  const defaultConfig = {
    fontSize: getFirstValue(configProp.fontSizes),
    letterSpacing: getFirstValue(configProp.letterSpacings),
    fontWeight: getFirstValue(configProp.fontWeights),
    lineHeight: getFirstValue(configProp.lineHeights),
  };

  const [config, setConfig] = useState(defaultConfig);

  useEffect(() => {
    setConfig(defaultConfig);
  }, [configProp]);

  const updateConfig = (key: string, value: string) => {
    console.log('key :>> ', key, value);
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const onChangeConfig = (e: Event | React.FormEvent<HTMLElement>, key: string) => {
    const event = e as React.FormEvent<HTMLInputElement>;
    updateConfig(key, event.currentTarget.value);
  };

  const renderTokenSwitch = (token: keyof typeof defaultConfig) => (
    <VSCodeDropdown
      value={config[token].toString()}
      onChange={(e) => onChangeConfig(e, token)}
      className="token-switch"
    >
      {Object.entries(configProp[`${token}s`]).map(([label, value]) => (
        <VSCodeOption key={value} value={value.toString()}>
          {label} ({value})
        </VSCodeOption>
      ))}
    </VSCodeDropdown>
  );

  return (
    <div className="token-group">
      <div className="token-content">
        <div className="typography-playground">
          <div contentEditable="true" style={config}>
            Panda
          </div>
          <div className="controls">
            {Object.keys(defaultConfig).map((tokenKey) => (
              <div className="control">
                <span>{tokenKey.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}</span>
                {renderTokenSwitch(tokenKey as keyof typeof defaultConfig)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
