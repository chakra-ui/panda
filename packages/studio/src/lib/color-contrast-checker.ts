// Credits: https://github.com/bbc/color-contrast-checker

interface Pair {
  colorA: string
  colorB: string
  fontSize: number
}
interface Rgb {
  r: number
  g: number
  b: number
}

class RgbClass {
  r = 0
  g = 0
  b = 0
  toString = () => {
    return '<r: ' + this.r + ' g: ' + this.g + ' b: ' + this.b + ' >'
  }
}

class Result {
  WCAG_AA = false
  WCAG_AAA = false
  customRatio: number | undefined = undefined
  toString = () => {
    return '< WCAG-AA: ' + (this.WCAG_AA ? 'pass' : 'fail') + ' WCAG-AAA: ' + (this.WCAG_AAA ? 'pass' : 'fail') + ' >'
  }
}

export class ColorContrastChecker {
  fontSize = 14

  rgbClass = new RgbClass()

  isValidSixDigitColorCode = (hex: string) => {
    const regSixDigitColorcode = /^(#)?([0-9a-fA-F]{6})?$/
    return regSixDigitColorcode.test(hex)
  }

  isValidThreeDigitColorCode = (hex: string) => {
    const regThreeDigitColorcode = /^(#)?([0-9a-fA-F]{3})?$/
    return regThreeDigitColorcode.test(hex)
  }

  isValidColorCode = (hex: string) => {
    return this.isValidSixDigitColorCode(hex) || this.isValidThreeDigitColorCode(hex)
  }

  isValidRatio = (ratio: unknown) => {
    return typeof ratio === 'number'
  }

  convertColorToSixDigit = (hex: string) => {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
  }

  hexToLuminance = (color: string) => {
    if (!this.isValidColorCode(color)) {
      throw new Error('Invalid Color :' + color)
    }

    if (this.isValidThreeDigitColorCode(color)) {
      color = this.convertColorToSixDigit(color)
    }

    const rgb = this.getRGBFromHex(color)

    const LRGB = this.calculateLRGB(rgb)

    return this.calculateLuminance(LRGB)
  }

  check = (colorA: string, colorB: string, fontSize?: number, customRatio?: number) => {
    if (typeof fontSize !== 'undefined') {
      this.fontSize = fontSize
    }

    if (!colorA || !colorB) {
      return false
    }

    const l1 = this.hexToLuminance(colorA) /* higher value */
    const l2 = this.hexToLuminance(colorB) /* lower value */
    const contrastRatio = this.getContrastRatio(l1, l2)

    if (typeof customRatio !== 'undefined') {
      if (!this.isValidRatio(customRatio)) {
        return false
      }
      return this.verifyCustomContrastRatio(contrastRatio, customRatio)
    } else {
      return this.verifyContrastRatio(contrastRatio)
    }
  }

  checkPairs = (pairs: Pair[], customRatio?: number) => {
    const results = []

    for (const i in pairs) {
      const pair = pairs[i]
      if (typeof pair.fontSize !== 'undefined') {
        results.push(this.check(pair.colorA, pair.colorB, pair.fontSize, customRatio))
      } else {
        results.push(this.check(pair.colorA, pair.colorB, void 0, customRatio))
      }
    }
    return results
  }

  calculateLuminance = (lRGB: Rgb) => {
    return 0.2126 * lRGB.r + 0.7152 * lRGB.g + 0.0722 * lRGB.b
  }

  isLevelAA = (colorA: string, colorB: string, fontSize: number) => {
    const result = this.check(colorA, colorB, fontSize)
    return result.WCAG_AA
  }

  isLevelAAA = (colorA: string, colorB: string, fontSize: number) => {
    const result = this.check(colorA, colorB, fontSize)
    return result.WCAG_AAA
  }

  isLevelCustom = (colorA: string, colorB: string, ratio: number) => {
    const result = this.check(colorA, colorB, undefined, ratio)
    return result.customRatio
  }

  getRGBFromHex = (color: string) => {
    const rgb = new RgbClass()

    if (typeof color !== 'string') {
      throw new Error('must use string')
    }

    const rVal = parseInt(color.slice(1, 3), 16)
    const gVal = parseInt(color.slice(3, 5), 16)
    const bVal = parseInt(color.slice(5, 7), 16)

    rgb.r = rVal
    rgb.g = gVal
    rgb.b = bVal

    return rgb
  }

  calculateSRGB = (rgb: Rgb) => {
    const sRGB = new RgbClass()

    for (const key in rgb) {
      sRGB[key as keyof Rgb] = parseFloat((rgb[key as keyof Rgb] / 255).toString())
    }

    return sRGB
  }

  calculateLRGB = (rgb: Rgb) => {
    const sRGB = this.calculateSRGB(rgb)
    const lRGB = Object.create(this.rgbClass)
    let val = 0

    for (const key in sRGB) {
      //@ts-ignore
      val = parseFloat(sRGB[key])
      if (val <= 0.03928) {
        lRGB[key] = val / 12.92
      } else {
        lRGB[key] = Math.pow((val + 0.055) / 1.055, 2.4)
      }
    }

    return lRGB
  }

  getContrastRatio = (lumA: number, lumB: number) => {
    let lighter: number
    let darker: number

    if (lumA >= lumB) {
      lighter = lumA
      darker = lumB
    } else {
      lighter = lumB
      darker = lumA
    }

    const ratio = (lighter + 0.05) / (darker + 0.05)

    return ratio
  }

  verifyContrastRatio = (ratio: number) => {
    const WCAG_REQ_RATIO_AA_LG = 3.0,
      WCAG_REQ_RATIO_AA_SM = 4.5,
      WCAG_REQ_RATIO_AAA_LG = 4.5,
      WCAG_REQ_RATIO_AAA_SM = 7.0,
      WCAG_FONT_CUTOFF = 18

    const results = new Result()
    const fontSize = this.fontSize || 14

    if (fontSize >= WCAG_FONT_CUTOFF) {
      results.WCAG_AA = ratio >= WCAG_REQ_RATIO_AA_LG
      results.WCAG_AAA = ratio >= WCAG_REQ_RATIO_AAA_LG
    } else {
      results.WCAG_AA = ratio >= WCAG_REQ_RATIO_AA_SM
      results.WCAG_AAA = ratio >= WCAG_REQ_RATIO_AAA_SM
    }

    return results
  }

  verifyCustomContrastRatio = (inputRatio: number, checkRatio: number) => {
    const resultsClass = new Result()
    resultsClass.toString = function () {
      return '< Custom Ratio: ' + (this.customRatio ? 'pass' : 'fail') + '  >'
    }

    const results = Object.create(resultsClass)

    results.customRatio = inputRatio >= checkRatio
    return results
  }
}
