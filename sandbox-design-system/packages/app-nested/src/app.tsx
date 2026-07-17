import { dsNestedButton } from '@sandbox/ds-nested/button'
// Both import roots must resolve under Vite:
// - package export → DS-owned styled-system (DS + parent tokens)
// - local outdir → full consumer re-emit (DS + parent + app overrides)
import { css as dsCss, cx } from '@sandbox/ds-nested/css'
import { css } from '../styled-system/css'

export function App() {
  return (
    <main
      className={cx(
        dsNestedButton,
        // DS package css — foundations + ds-nested tokens
        dsCss({
          backgroundColor: 'bg.neutral',
          borderColor: 'foundation',
          padding: 'foundationGap',
        }),
        // Local outdir css — app spacing.2 + app brand override in emit
        css({
          color: 'brand',
          padding: '2',
        }),
      )}
    />
  )
}
