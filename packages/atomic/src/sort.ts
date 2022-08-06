// The order of the generated CSS is dependent on the order of the selectors.
const variantOrder = [
  'first',
  'last',
  'odd',
  'even',
  'visited',
  'checked',
  'empty',
  'read-only',
  'group-hover',
  'group-focus',
  'focus-within',
  'hover',
  'focus',
  'focus-visible',
  'active',
  'disabled',
]

export function sortConditionByOrder(conditions: string[]) {
  return conditions.sort((a, b) => {
    const aIndex = variantOrder.indexOf(a)
    const bIndex = variantOrder.indexOf(b)
    return aIndex - bIndex
  })
}
