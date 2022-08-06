function getRootElementFontSize() {
  // Returns a number
  return parseFloat(
    // of the computed font-size, so in px
    getComputedStyle(
      // for the root <html> element
      document.documentElement,
    ).fontSize,
  )
}

export const remToPixels = (rem: string) => {
  const remFloat = parseFloat(rem)
  if (Number.isNaN(remFloat)) return '-'
  return remFloat * getRootElementFontSize() + 'px'
}
