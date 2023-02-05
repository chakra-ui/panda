import helperMjs from '../generated/helpers.mjs.json' assert { type: 'json' }

export function generateIsValidProp() {
  return { js: helperMjs.content }
}
