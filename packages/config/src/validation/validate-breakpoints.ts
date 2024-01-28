import type { Theme } from '@pandacss/types'
import type { AddError } from '../types'

export const validateBreakpoints = (breakpoints: Theme['breakpoints'], addError: AddError) => {
  if (!breakpoints) return

  const units = new Set<string>()

  const values = Object.values(breakpoints)

  for (const value of values) {
    const unit = value.replace(/[0-9]/g, '')
    units.add(unit)
  }

  if (units.size > 1) {
    addError('breakpoints', `All breakpoints must use the same unit: \`${values.join(', ')}\``)
  }
}
