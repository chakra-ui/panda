import { useEffect, useState } from 'react';
import ColorPicker from 'simple-color-picker';
import ColorContrastChecker from 'color-contrast-checker';

export const useColorPickers = (colorFormat: ColorFormats) => {
  const [foreground, setForeGround] = useState('#000000');
  const [foreGroundPicker, setForeGroundPicker] = useState<ColorPicker>();

  const [background, setBackground] = useState('#ffffff');
  const [backGroundPicker, setBackGroundPicker] = useState<ColorPicker>();

  const foregroundHex = foreGroundPicker?.getHexString();
  const backgroundHex = backGroundPicker?.getHexString();

  useEffect(() => {
    const fPicker = new ColorPicker({
      el: '#foreground',
      color: foregroundHex || foreground,
    });
    fPicker.onChange((hex: string) => {
      setInputColor(setForeGround, hex, colorFormat);
    });
    setForeGroundPicker(fPicker);

    const bPicker = new ColorPicker({
      el: '#background',
      color: backgroundHex || background,
    });
    bPicker.onChange((hex: string) => {
      setInputColor(setBackground, hex, colorFormat);
    });
    setBackGroundPicker(bPicker);

    return () => {
      fPicker.remove();
      bPicker.remove();
    };
  }, [colorFormat]);

  return { foreground, background, foreGroundPicker, backGroundPicker, foregroundHex, backgroundHex };
};

export const getContrastPairs = (colorA?: string, colorB?: string) => {
  var contrastChecker = new ColorContrastChecker();
  let res;
  try {
    res = contrastChecker.checkPairs([
      {
        colorA,
        colorB,
        fontSize: 14,
      },
      {
        colorA,
        colorB,
        fontSize: 18,
      },
    ]);
  } catch (error) {}

  return res;
};

export const getContrastRatioArr = (colorA?: string, colorB?: string) => {
  var contrastChecker = new ColorContrastChecker();
  var lighter, darker, luminanceA, luminanceB;

  try {
    luminanceA = contrastChecker.hexToLuminance(colorA);
    luminanceB = contrastChecker.hexToLuminance(colorB);
    if (luminanceA >= luminanceB) {
      lighter = luminanceA;
      darker = luminanceB;
    } else {
      lighter = luminanceB;
      darker = luminanceA;
    }
  } catch (error) {}

  return [lighter + 0.05, darker + 0.05].map((a) => (Number.isNaN(a) ? '' : a.toFixed(2)));
};

export const setInputColor = (
  setter: React.Dispatch<React.SetStateAction<string>>,
  hex: string,
  colorFormat: ColorFormats
) => {
  const eventMap = {
    hex: () => hex,
    rgb: () => hexToRGB(hex),
    hsl: () => RGBToHSL(hexToRGB(hex)),
  };
  const color = eventMap[colorFormat]();
  if (color) setter(color as string);
};

export const setPickerColor = (color: string, picker: ColorPicker | undefined) => {
  if (color) picker?.setColor(color);
};

export enum ColorFormats {
  HEX = 'hex',
  RGB = 'rgb',
  HSL = 'hsl',
}

export const colorFormats = [
  {
    id: ColorFormats.HEX,
    label: 'HEX',
  },
  {
    id: ColorFormats.RGB,
    label: 'RGB',
  },
  {
    id: ColorFormats.HSL,
    label: 'HSL',
  },
];

export function hexToRGB(h: string) {
  let r: string | number = 0,
    g: string | number = 0,
    b: string | number = 0;

  // 3 digits
  if (h.length == 4) {
    r = '0x' + h[1] + h[1];
    g = '0x' + h[2] + h[2];
    b = '0x' + h[3] + h[3];

    // 6 digits
  } else if (h.length == 7) {
    r = '0x' + h[1] + h[2];
    g = '0x' + h[3] + h[4];
    b = '0x' + h[5] + h[6];
  }

  return 'rgb(' + +r + ',' + +g + ',' + +b + ')';
}

export function RGBToHSL(rgbString: string) {
  let sep = rgbString.indexOf(',') > -1 ? ',' : ' ';
  let rgb = rgbString
    .substr(4)
    .split(')')[0]
    .split(sep)
    .map((r) => parseInt(r));

  // Make r, g, and b fractions of 1
  let r = rgb[0] / 255,
    g = rgb[1] / 255,
    b = rgb[2] / 255;

  // Find greatest and smallest channel values
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  // Calculate hue
  // No difference
  if (delta == 0) h = 0;
  // Red is max
  else if (cmax == r) h = ((g - b) / delta) % 6;
  // Green is max
  else if (cmax == g) h = (b - r) / delta + 2;
  // Blue is max
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  // Make negative hues positive behind 360°
  if (h < 0) h += 360;

  // Calculate lightness
  l = (cmax + cmin) / 2;

  // Calculate saturation
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Multiply l and s by 100
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}
