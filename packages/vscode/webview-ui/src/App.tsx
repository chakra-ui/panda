import { VSCodeButton, VSCodeDropdown, VSCodeOption, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';
import './App.css';
import { useEffect, useState } from 'react';
import { Colors } from './components/color-docs';
import { FontTokens } from './components/font-docs';
import { navItems, NavKeys } from './utilities/constants';
import { TypographyPlayground } from './components/typography-playground';
import { Sizes } from './components/size-docs';
import { SpacingPlayground } from './components/spacing-playground';
import { ContrastChecker } from './components/contrast-checker';
import { vscode } from './utilities/vscode';
import { Config } from './types';

function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [page, setPage] = useState(NavKeys.COLORS);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const reload = () => {
    vscode.postMessage({ type: 'reload' });
  };

  useEffect(() => {
    vscode.postMessage({ type: 'fetchConfig' });
    // Listen for messages from the extension
    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'onConfigChange': {
          setConfig(message.value);
          if (loadingConfig) setLoadingConfig(false);
          break;
        }
      }
    });
  }, []);

  const onSwitchChange: ((e: Event) => unknown) & React.FormEventHandler<HTMLElement> = (e) => {
    const event = e as React.FormEvent<HTMLInputElement>;
    setPage(event.currentTarget.value as NavKeys);
  };

  if (loadingConfig) {
    return (
      <div>
        <VSCodeProgressRing />
      </div>
    );
  }
  if (!config)
    return (
      <div>
        <p>Panda config not found, create a config and reload</p>
        <VSCodeButton onClick={reload}>Reload </VSCodeButton>
      </div>
    );

  return (
    <main>
      <span>We're looking at:</span>
      <VSCodeDropdown value={page} onChange={onSwitchChange} className="token-switch">
        {navItems.map((themeKey) => (
          <VSCodeOption key={themeKey.id} value={themeKey.id}>
            {themeKey.label}
          </VSCodeOption>
        ))}
      </VSCodeDropdown>
      {page === NavKeys.COLORS && <Colors colors={config.colors} />}
      {page === NavKeys.FONT_WEIGHTS && <FontTokens fontTokens={config.fontWeights} token="fontWeight" />}
      {page === NavKeys.FONT_SIZES && <FontTokens fontTokens={config.fontSizes} token="fontSize" />}
      {page === NavKeys.LETTER_SPACINGS && (
        <FontTokens
          fontTokens={config.letterSpacings}
          token="letterSpacing"
          text="The quick brown fox jumps over the lazy dog."
        />
      )}
      {page === NavKeys.LINE_HEIGHTS && (
        <FontTokens
          fontTokens={config.lineHeights}
          token="lineHeight"
          largeText
          text="So I started to walk into the water. I won't lie to you boys, I was terrified. But I pressed on, and as I made my way past the breakers a strange calm came over me. I don't know if it was divine intervention or the kinship of all living things but I tell you Jerry at that moment, I was a marine biologist."
        />
      )}
      {page === NavKeys.TYPOGRAPHY_PLAYGROUND && <TypographyPlayground config={config} />}
      {page === NavKeys.SIZES && <Sizes sizes={config.sizes} />}
      {page === NavKeys.SPACING_PLAYGROUND && <SpacingPlayground sizes={config.sizes} />}
      {page === NavKeys.CONTRAST_CHECKER && <ContrastChecker colors={config.colors} />}
    </main>
  );
}

export default App;
