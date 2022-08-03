import { VSCodeDropdown, VSCodeOption, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import { useState } from 'react';
import {
  colorFormats,
  ColorFormats,
  getContrastPairs,
  getContrastRatioArr,
  setPickerColor,
  useColorPickers,
} from '../utilities/color';

export function ContrastChecker() {
  const [colorFormat, setColorFormat] = useState(ColorFormats.HEX);

  const { foreground, background, foreGroundPicker, backGroundPicker, foregroundHex, backgroundHex } =
    useColorPickers(colorFormat);

  const colorFormatSwitch = (
    <VSCodeDropdown value={colorFormat} onChange={(e: any) => setColorFormat(e.currentTarget.value)}>
      {colorFormats.map((format) => (
        <VSCodeOption key={format.id} value={format.id}>
          {format.label}
        </VSCodeOption>
      ))}
    </VSCodeDropdown>
  );

  const WCAGTests = getContrastPairs(foregroundHex, backgroundHex);

  const constrastRatio = getContrastRatioArr(foregroundHex, backgroundHex);

  const renderTestScore = (score: { WCAG_AA: boolean; WCAG_AAA: boolean }) => {
    return (
      <>
        <div>
          <span>AA</span>
          <span>{score.WCAG_AA ? '✓' : '❌'}</span>
        </div>
        <div>
          <span>AAA</span>
          <span>{score.WCAG_AAA ? '✓' : '❌'}</span>
        </div>
      </>
    );
  };

  return (
    <div className="token-group contrast-checker">
      <div className="token-content ">
        <div className="color-container">
          <div>
            <div id="foreground" />
            <div className="controls">
              <VSCodeTextField
                value={foreground}
                onInput={(e: any) => {
                  setPickerColor(e.currentTarget.value, foreGroundPicker);
                }}
              />
              {colorFormatSwitch}
            </div>
          </div>
          <div>
            <div id="background" />
            <div className="controls">
              <VSCodeTextField
                value={background}
                onInput={(e: any) => {
                  setPickerColor(e.currentTarget.value, backGroundPicker);
                }}
              />
              {colorFormatSwitch}
            </div>
          </div>
        </div>

        <div
          className="preview"
          suppressContentEditableWarning
          contentEditable
          style={{ background, color: foreground }}
        >
          example text showing contrast
        </div>

        <div className="result">
          <div className="contrast-ratio">
            <span>
              {constrastRatio[0]}:{constrastRatio[1]}
            </span>
            <span>Contrast ratio</span>
          </div>
          <div className="test-scores">
            <div>
              <span>Normal Text</span>
              {renderTestScore(WCAGTests[0])}
            </div>
            <div>
              <span>Large Text</span>
              {renderTestScore(WCAGTests[1])}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
