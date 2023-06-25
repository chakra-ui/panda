import cssesc from 'cssesc'

const escapeRegExp = /(^[^_a-zA-Z\u00a0-\uffff]|[^-_a-zA-Z0-9\u00a0-\uffff])/g
export function esc(str: string) {
  //@ts-ignore

  // Option A
  const classNameA = cssesc(str, { isIdentifier: true })

  // Option C
  let classNameB = str
  if (/^\d/.test(str)) {
    const leadingDigit = str.charAt(0)
    const leadingDigitCode = leadingDigit.charCodeAt(0)

    // Escape the leading digit using its Unicode equivalent
    classNameB = classNameB.replace(/^\d/, leadingDigitCode.toString(16).toUpperCase())
  }

  classNameB = classNameB.replace(escapeRegExp, '\\$1')

  console.log({ classNameA, classNameB })

  return classNameB
}
