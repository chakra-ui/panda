import type { UtilityConfig } from '@pandacss/types'
import { cssVar } from '../css-var'

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
    globalVars: { '--border-spacing-x': cssVar('<length>', '0') },
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
    globalVars: { '--border-spacing-y': cssVar('<length>', '0') },
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
