import type { UtilityConfig } from '@pandacss/types'

export const tables: UtilityConfig = {
  borderCollapse: {
    className: 'border',
    group: 'Table',
  },
  borderSpacing: {
    className: 'border-spacing',
    group: 'Table',
    values(theme) {
      return {
        ...theme('spacing'),
        auto: 'var(--border-spacing-x) var(--border-spacing-y)',
      }
    },
  },
  borderSpacingX: {
    className: 'border-spacing-x',
    values: 'spacing',
    group: 'Table',
    transform(value) {
      return {
        '--border-spacing-x': value,
      }
    },
  },
  borderSpacingY: {
    className: 'border-spacing-y',
    values: 'spacing',
    group: 'Table',
    transform(value) {
      return {
        '--border-spacing-y': value,
      }
    },
  },
  tableLayout: {
    className: 'table',
    group: 'Table',
  },
}
