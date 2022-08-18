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
  fontSize: 'lg',
  color: { _: 'gray.200', dark: '#fff' },
  margin: '40px',
  padding: '50px',
  display: 'flex',
  flexBasis: '1/2',
  width: { _: '1/2', md: '2/4' },
  maxWidth: 'sm',
})

const test = true ? css({ color: 'red' }) : css({ color: 'pink' })
