import { css, sva } from '../styled-system/css'
import { cq } from '../styled-system/patterns'
// @ts-expect-error ts 5.4 will fix it
import { btn } from '#styles/recipes'

const button = sva({
  className: 'button',
  slots: ['root', 'text'],
  base: {
    root: {
      bg: 'blue.500',
      _hover: {
        '& .button__text': {
          color: 'white',
        },
      },
    },
  },
})

export const App = () => {
  const classes = button({ size: 'sm' })
  return (
    <>
      <div className={cq()}>
        <a className={css({ bg: { '@/sm': 'red.300' } })}>Click me</a>
      </div>
      <div
        className={css({
          sm: {
            color: 'yellow',
          },
          _focus: {
            color: 'blue',
          },
        })}
      ></div>
      <div className={classes.root}>
        <div className={classes.text}>Click me</div>
      </div>
      <div className={btn()}>aaaa Click me</div>
    </>
  )
}
