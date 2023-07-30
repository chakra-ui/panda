import { getSlotRecipes } from '../helpers.mjs'
import { cva } from './cva.mjs'

export function sva(config) {
  const entries = Object.entries(getSlotRecipes(config))

  const slots = []

  for (const [slot, slotCva] of entries) {
    slots.push([slot, cva(slotCva)])
  }

  function svaFn(props) {
    const result = slots.map(([slot, cvaFn]) => [slot, cvaFn(props)])
    return Object.fromEntries(result)
  }

  return Object.assign(svaFn, {
    __sva__: true,
  })
}
