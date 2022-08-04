import ColorContrastChecker from 'color-contrast-checker';

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

export const getContrastRatio = (colorA?: string, colorB?: string) => {
  var contrastChecker = new ColorContrastChecker();
  var luminanceA, luminanceB;
  var ratio: number | undefined;

  try {
    luminanceA = contrastChecker.hexToLuminance(colorA);
    luminanceB = contrastChecker.hexToLuminance(colorB);
    ratio = contrastChecker.getContrastRatio(luminanceA, luminanceB);
  } catch (error) {}

  return ratio;
};
