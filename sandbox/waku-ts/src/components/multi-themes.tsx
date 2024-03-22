'use client'
import { css } from '../../styled-system/css/index.js'
import { hstack } from '../../styled-system/patterns/hstack.js'
import { getTheme, injectTheme } from '../../styled-system/themes/index.js'

export const MultiThemes = () => {
  return (
    <div className={css({ m: '4' })}>
      <button
        className={css({ bg: 'blue.300', px: '2', py: '0.5', textStyle: 'sm', borderRadius: 'sm' })}
        onClick={async () => {
          // const el = document.documentElement
          const el = document.getElementById('abc')!
          const current = el.dataset.pandaTheme
          const next = current === 'primary' ? 'secondary' : 'primary'
          const theme = await getTheme(next)
          injectTheme(el, theme)
        }}
      >
        swap theme
      </button>
      <div id="abc" className={css({ p: '4', my: '4', border: '1px dashed {colors.blue.300}' })}>
        <span>inside of container</span>
        <ThemeExample />
        <ThemeExample name="primary" />
        <ThemeExample name="secondary" />
      </div>
      <div className={css({ p: '4', my: '4', border: '1px dashed {colors.green.300}' })}>
        <span>outside of container</span>
        <ThemeExample />
        <ThemeExample name="primary" />
        <ThemeExample name="secondary" />
      </div>
    </div>
  )
}

const ThemeExample = ({ name }: { name?: string }) => {
  return (
    <div className={hstack({ p: '4', my: '4', border: '1px dashed' })} data-panda-theme={name ? name : undefined}>
      <span>{name || 'inherit'}:</span>
      <span className={css({ color: 'text' })}>text</span>
      <span className={css({ color: 'body' })}>body</span>
      <span className={css({ color: 'muted' })}>muted</span>
    </div>
  )
}
