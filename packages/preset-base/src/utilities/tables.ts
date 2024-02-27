import type { UtilityConfig } from '@pandacss/types'

export const tables: UtilityConfig = {
  borderCollapse: {
    className: 'border',
    group: 'Table',
  },
  borderSpacing: {
    className: 'border-spacing',
    values: 'spacing',
    group: 'Table',
  },
  borderSpacingX: {
    className: 'border-spacing-x',
    values: 'spacing',
    group: 'Table',
    transform(value) {
      return {
        borderSpacing: `${value} var(--border-spacing-y)`,
      }
    },
  },
  borderSpacingY: {
    className: 'border-spacing-y',
    values: 'spacing',
    group: 'Table',
    transform(value) {
      return {
        borderSpacing: `var(--border-spacing-x) ${value}`,
      }
    },
  },
  tableLayout: {
    className: 'table',
    group: 'Table',
  },
}
