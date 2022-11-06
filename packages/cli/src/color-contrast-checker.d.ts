declare module 'color-contrast-checker' {
  export default class ColorContrastChecker {
    isValidThreeDigitColorCode(colorCode: string): boolean
    isValidSixDigitColorCode(colorCode: string): boolean
    isValidColorCode(colorCode: string): boolean
    convertColorToSixDigit(colorCode: string): string
    checkPairs(
      pairs: Array<{ colorA: string | undefined; colorB: string | undefined; fontSize: number }>,
    ): Array<{ WCAG_AA: boolean; WCAG_AAA: bolean }>
    calculateLuminance(rgb: { r: number; g: number; b: number }): number
    hexToLuminance(color: string | undefined): number
    getContrastRatio(luminanceA: number, luminanceB: number): number
    isLevelAA(colorA: string | undefined, colorB: string | undefined, fontSize: number): boolean
    isLevelAAA(colorA: string | undefined, colorB: string | undefined, fontSize: number): boolean
  }
}
