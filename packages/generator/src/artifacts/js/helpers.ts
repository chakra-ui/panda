import { outdent } from 'outdent'
import helperMjs from '../generated/helpers.mjs.json' assert { type: 'json' }

export function generateHelpers() {
  return {
    js: outdent`
  ${helperMjs.content}

  export function __spreadValues(a, b){
    return { ...a, ...b }
  }

  export function __objRest(source, exclude){
    return Object.fromEntries(Object.entries(source).filter(([key]) => !exclude.includes(key)))
  }
  `,
  }
}
