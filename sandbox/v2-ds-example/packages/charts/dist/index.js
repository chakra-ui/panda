// Charts library — does NOT ship a panda.lib.json.
// Smart-include should auto-glob this file because the package has a `files`
// array pointing at `dist/`. The css() calls below get extracted by the
// consumer's panda when '@v2-ds-example/charts' is in `include`.
//
// Uses the design system's tokens directly (brand, surface) so the demo
// shows that smart-include + token resolution work together.
import { css } from '@v2-ds-example/lib/styled-system/css'

export const chartContainer = css({
  bg: 'surface',
  color: 'brand',
  p: '6',
  borderRadius: '12px',
  borderWidth: '1px',
  borderColor: 'brand',
})

export const chartLegend = css({
  bg: 'brand',
  color: 'surface',
  p: '2',
  borderRadius: '4px',
})
