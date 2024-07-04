import type { UtilityConfig } from '@pandacss/types'

export const tables: UtilityConfig = {
  borderCollapse: {
    className: 'bd-cl',
    group: 'Table',
  },
  borderSpacing: {
    className: 'bd-sp',
    group: 'Table',
    values(theme) {
      return {
        ...theme('spacing'),
        auto: 'var(--border-spacing-x) var(--border-spacing-y)',
      }
    },
  },
  borderSpacingX: {
    className: 'bd-sx',
    values: 'spacing',
    group: 'Table',
    transform(value) {
      return {
        '--border-spacing-x': value,
      }
    },
  },
  borderSpacingY: {
    className: 'bd-sy',
    values: 'spacing',
    group: 'Table',
    transform(value) {
      return {
        '--border-spacing-y': value,
      }
    },
  },
  tableLayout: {
    className: 'tbl',
    group: 'Table',
  },
}
