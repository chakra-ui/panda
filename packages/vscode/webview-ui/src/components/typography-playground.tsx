import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { useState } from 'react';
import { Config } from '../types';

type TypographyPlaygroundProps = { config: Config };

export function TypographyPlayground(props: TypographyPlaygroundProps) {
  const { config: configProp } = props;

  const getFirstToken = <T extends Record<any, any>>(obj: T) => Object.keys(obj)[0].toString();

  const defaultConfig = {
    fontSize: getFirstToken(configProp.fontSizes),
    letterSpacing: getFirstToken(configProp.letterSpacings),
    fontWeight: getFirstToken(configProp.fontWeights),
    lineHeight: getFirstToken(configProp.lineHeights),
  };

  const [config, setConfig] = useState(defaultConfig);
  const configValues = Object.entries(config).reduce(
    (acc, [token, label]) => ({ ...acc, [token]: configProp[`${token}s` as keyof Config][label] }),
    {}
  );

  const updateConfig = (key: string, value: string) => {
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
    <VSCodeDropdown value={config[token]} onChange={(e) => onChangeConfig(e, token)} className="token-switch">
      {Object.entries(configProp[`${token}s`]).map(([label, value]) => (
        <VSCodeOption key={value} value={label}>
          {label} ({value})
        </VSCodeOption>
      ))}
    </VSCodeDropdown>
  );

  return (
    <div className="token-group">
      <div className="token-content">
        <div className="typography-playground">
          <div contentEditable="true" style={configValues}>
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
