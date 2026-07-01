import { dsNestedButton } from '@sandbox/ds-nested/button'
import { css, cx } from '../styled-system/css'

export function App() {
  return (
    <main
      className={cx(
        dsNestedButton,
        css({
          color: 'brand',
          padding: '2',
        }),
      )}
    />
  )
}
