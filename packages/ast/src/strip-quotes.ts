// strip inner quotes
// e.g '"&:active"' -> '&:active'

export function stripQuotes(q: string) {
  const quoteStart = `'|"|‘|“|‹|«` // \u0022|\u0027|\u2018|\u201C|\u2039|\u00AB
  const quoteEnd = `'|"|’|”|›|»` // \u0022|\u0027|\u2019|\u201D|\u203A|\u00BB

  if (typeof q !== 'string') throw new Error(`input was '${typeof q}' and not of type 'string'`)
  if (!q.length) throw new Error(`input was empty`)

  let s = q
  let t = s.length

  if (s.charAt(0).match(new RegExp(quoteStart))) {
    s = s.substring(1, t--)
  }

  if (s.charAt(--t).match(new RegExp(quoteEnd))) {
    s = s.substring(0, t)
  }

  return s
}
