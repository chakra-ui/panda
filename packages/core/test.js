import { css } from './__generated__/css'

console.log(
  console.log(
    css({
      background: 'red.400',
      fontWeight: { sm: 'bold', md: 'medium' },
      display: 'flex',
      flexDirection: { _: 'column', md: 'row' },
      color: { _: 'red', dark: 'pink' },
      selectors: {
        '&:hover': {
          background: 'red.200',
        },
      },
    }),
  ),
)

css({
  background: 'red.400',
})

const test = true ? css({ color: 'red' }) : css({ color: 'pink' })
